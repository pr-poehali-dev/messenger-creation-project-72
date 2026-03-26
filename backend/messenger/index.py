import json
import os
import psycopg2
from datetime import datetime


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def format_time(dt: datetime) -> str:
    now = datetime.now(dt.tzinfo)
    diff = now - dt
    if diff.days == 0:
        return dt.strftime("%H:%M")
    elif diff.days == 1:
        return "Вчера"
    elif diff.days < 7:
        days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
        return days[dt.weekday()]
    else:
        return dt.strftime("%d.%m")


def handler(event: dict, context) -> dict:
    """Мессенджер API: чаты, сообщения, отправка"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET /chats — список чатов с последним сообщением
        if method == "GET" and (path.endswith("/chats") or action == "chats"):
            cur.execute("""
                SELECT
                    c.id,
                    c.name,
                    c.avatar,
                    u.online,
                    m.text AS last_message,
                    m.created_at AS last_time,
                    COUNT(m2.id) FILTER (WHERE m2.is_read = false AND m2.sender_id != 1) AS unread
                FROM tg_chats c
                LEFT JOIN tg_users u ON u.name = c.name
                LEFT JOIN LATERAL (
                    SELECT text, created_at FROM tg_messages
                    WHERE chat_id = c.id
                    ORDER BY created_at DESC LIMIT 1
                ) m ON true
                LEFT JOIN tg_messages m2 ON m2.chat_id = c.id
                GROUP BY c.id, c.name, c.avatar, u.online, m.text, m.created_at
                ORDER BY m.created_at DESC NULLS LAST
            """)
            rows = cur.fetchall()
            chats = []
            for r in rows:
                chats.append({
                    "id": r[0],
                    "name": r[1],
                    "avatar": r[2],
                    "online": r[3] or False,
                    "lastMessage": r[4] or "",
                    "time": format_time(r[5]) if r[5] else "",
                    "unread": r[6] or 0,
                })
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"chats": chats}, ensure_ascii=False)}

        # GET /messages?chat_id=X — сообщения чата
        elif method == "GET" and (path.endswith("/messages") or action == "messages"):
            chat_id = int(params.get("chat_id", 0))
            cur.execute("""
                SELECT id, sender_id, text, is_read, created_at
                FROM tg_messages
                WHERE chat_id = %s
                ORDER BY created_at ASC
            """, (chat_id,))
            rows = cur.fetchall()
            messages = []
            for r in rows:
                messages.append({
                    "id": r[0],
                    "senderId": r[1],
                    "text": r[2],
                    "isOut": r[1] == 1,
                    "read": r[3],
                    "time": r[4].strftime("%H:%M") if r[4] else "",
                })
            # Mark as read
            cur.execute("""
                UPDATE tg_messages SET is_read = true
                WHERE chat_id = %s AND sender_id != 1 AND is_read = false
            """, (chat_id,))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"messages": messages}, ensure_ascii=False)}

        # POST /send — отправить сообщение
        elif method == "POST" and (path.endswith("/send") or action == "send"):
            body = json.loads(event.get("body") or "{}")
            chat_id = int(body.get("chat_id", 0))
            text = body.get("text", "").strip()
            if not chat_id or not text:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "chat_id and text required"})}
            cur.execute("""
                INSERT INTO tg_messages (chat_id, sender_id, text, is_read)
                VALUES (%s, 1, %s, false)
                RETURNING id, created_at
            """, (chat_id, text))
            row = cur.fetchone()
            conn.commit()
            msg = {
                "id": row[0],
                "senderId": 1,
                "text": text,
                "isOut": True,
                "read": False,
                "time": row[1].strftime("%H:%M"),
            }
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"message": msg}, ensure_ascii=False)}

        else:
            return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()