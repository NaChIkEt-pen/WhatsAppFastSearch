from langchain_openai import OpenAIEmbeddings
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()
def process_embeddings(mob):
    offset_file = f'last_offset-{mob}.txt'
    last_offset = 0
    if os.path.exists(offset_file):
        with open(offset_file, 'r') as off_f:
            content = off_f.read().strip()
            if content.isdigit():
                last_offset = int(content)

    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    
    conn = psycopg2.connect(
        dbname=db_name,
        user=db_user,
        password=db_password
    )

    if conn:
        cur = conn.cursor()
        print("Cursor created successfully")
    else:
        print("Connection is not valid")

    model = OpenAIEmbeddings(
        openai_api_base = "http://localhost:1234/v1",
        api_key = "type-anything-here",
        check_embedding_ctx_length = False
    )

    with open(f'chat-{mob}.txt') as f:
        f.seek(last_offset)
        for line in f:
            line = line.strip()
            if line:
                vector = model.embed_query(line)
                try:
                    cur.execute(
                        "INSERT INTO items (content, embedding, mob) VALUES (%s, %s, %s)",
                        (line, vector, mob)
                    )
                    conn.commit()
                    print("Data inserted successfully")    
                except psycopg2.Error as e:
                    print(f"Database error: {e}")
        new_offset = f.tell()
    with open(offset_file, 'w') as off_f:
        off_f.write(str(new_offset))
    cur.close()
    conn.close()
    # print(vector)

