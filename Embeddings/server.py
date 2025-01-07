from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import math, random
import psycopg2
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()
import jwt  
  
header = {  
  "alg": "HS256",  
  "typ": "JWT"  
}  

from main import process_embeddings
from index import search_embeddings

app = Flask(__name__)
CORS(app) 
# encoded_jwt = jwt.encode(payload, secret, algorithm='HS256', headers=header)  
@app.route('/', methods=['POST'])
def receive_messages():
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        mob = data.get('mob')
        print('Received messages:', mob)  # Print messages to console
        
        with open(f'../Embeddings/chat-{mob}.txt', 'a', encoding='utf-8') as f:
            for message in messages:
                cleaned_message = message.replace('\n', '').strip()
                f.write(cleaned_message + '\n')
        process_embeddings(mob)
        return jsonify({'status': 'success'})
    except Exception as e:
        print('Error:', str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/search', methods=['POST'])
def query():
    try:
        data = request.get_json()
        query = data.get('query')
        mob = data.get('mob')
        print('Received Query:', mob, query)
        ret = search_embeddings(query)
        # print("this")
        # print(*ret)
        return jsonify({'status': 'success', 'res':ret})
    except Exception as e:
        print('Error:', str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/stop', methods=['POST'])
def stop_search():
    data = request.get_json()
    mob = data.get('mob')
    try:
        db_name = os.getenv("DB_NAME")
        db_user = os.getenv("DB_USER")
        db_password = os.getenv("DB_PASSWORD")
        
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password
        )
        cur = conn.cursor()
        cur.execute("DELETE FROM items WHERE mob = %s;", (mob,))
        conn.commit() 
        cur.close()   
        conn.close()  
        open(f'../Embeddings/chat-{mob}.txt', 'w').close()
        open(f'../Embeddings/last_offset-{mob}.txt', 'w').close()
        return jsonify({'status': 'success'}) 
    except Exception as e:
        print('Error:', str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/gen-otp', methods=['POST'])
def gen_otp():
    data = request.get_json()
    mobno = data.get('mobno')
    digits = "0123456789"
    OTP = ""
    for i in range(6) :
        OTP += digits[math.floor(random.random() * 10)]
    
    
    auth_token = os.getenv("auth_token")
    account_sid = os.getenv("account_sid")
    client = Client(account_sid, auth_token)

    message = client.messages.create(
        from_='whatsapp:+14155238886',
        content_sid='HX229f5a04fd0510ce1b071852155d3e75',
        content_variables=f"""{{"1":"{OTP}"}}""",
        to=f'whatsapp:+91{mobno}'
    )
    print(message)
    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    
    conn = psycopg2.connect(
        dbname=db_name,
        user=db_user,
        password=db_password
    )
    cur = conn.cursor()
    query = """
            INSERT INTO users (mobno, otp)
            VALUES (%s, %s)
            ON CONFLICT (mobno) 
            DO UPDATE SET otp = EXCLUDED.otp;
        """
    cur.execute(query, (mobno, OTP))
    conn.commit() 
    cur.close()   
    conn.close()  
    # print(message.sid , mobno)
    # print(OTP, mobno)

    return jsonify({'status': 'success'})

@app.route('/verify-otp', methods=['POST'])
def verifyOtp():
    
    data = request.get_json()
    otp = data.get('otp')
    mob = data.get('mob')
    
    if not otp or not mob:
        print("here")
        return jsonify({'status': 'error', 'message': 'OTP and mobile number are required'}), 400

    try:

        db_name = os.getenv("DB_NAME")
        db_user = os.getenv("DB_USER")
        db_password = os.getenv("DB_PASSWORD")

        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password
        )
        cur = conn.cursor()

        query = """
        SELECT otp FROM users
        WHERE mobno = %s;
        """

        # cur.execute(query, (str(mob),))
        cur.execute(
            "SELECT otp FROM users WHERE mobno = %s;",
            (str(mob),)
        )
        
        
        result = cur.fetchone()

        if result is None:
            # Mobile number not found
            return jsonify({'status': 'error', 'message': 'Mobile number not registered'}), 404

        stored_otp = result[0]
        # print(type(stored_otp))
        print(stored_otp)
        if stored_otp == int(otp):
            payload = {  
                "mob":str(mob),
                "exp": datetime.utcnow() + timedelta(minutes=59)
            }

            secret = os.getenv('jwtsecret')  

            encoded_jwt = jwt.encode(payload, secret, algorithm='HS256', headers=header)  
            cur.execute("UPDATE users SET jwt_token = %s WHERE mobno = %s;", (encoded_jwt, str(mob),))
            conn.commit()
            # response = make_response(jsonify({
            #     'status': 'success',
            #     'message': 'OTP verified successfully',
            #     'token': encoded_jwt
            #     }))
            # response.set_cookie(
            #     'token',              # Cookie name
            #     encoded_jwt,          # Cookie value
            #     httponly=True,        # Not accessible via JavaScript
            #     samesite='Strict',
            #     secure=True,          # Requires HTTPS in production
            #     max_age=3600          # Expires in 1 hour
            # )

            # return response
            return jsonify({'status': 'success', 'message': 'OTP verified successfully', 'jwt': encoded_jwt}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Invalid OTP'}), 401

    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

    finally:
        # Clean up database resources
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(host='localhost', port=8000, debug=True)