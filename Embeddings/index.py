from langchain_openai import OpenAIEmbeddings
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()
def search_embeddings(text):

    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")

    conn = psycopg2.connect(
        dbname=db_name,
        user=db_user,
        password=db_password
    )
    cur = conn.cursor()

    model = OpenAIEmbeddings(
        openai_api_base="http://localhost:1234/v1",
        api_key="type-anything-here",
        check_embedding_ctx_length=False
    )

    try:
        # text = input()
        query_vector = model.embed_query(text)
        cur.execute("""
            SELECT id, content, embedding <=> %s::vector(768) AS similarity
            FROM items
            ORDER BY similarity
            LIMIT 10;
        """, (query_vector,))
        
        # Fetch and display results
        results = cur.fetchall()
        ret = []
        for row in results:
            # print(f"ID: {row[0]}, Content: {row[1]}, Similarity: {row[2]}")
            ret.append(row[1])
        return ret
    except psycopg2.Error as e:
        print(f"Database error: {e}")
    finally:
        cur.close()
        conn.close()