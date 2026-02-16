from flask import Flask, render_template, request
from flask import jsonify
from flask_cors import CORS
import sqlite3
import os   

app = Flask(__name__)
CORS(app) #tarayıcıdan gelen istekleri kabul etmek için CORS'u etkinleştiriyoruz

DB_NAME = 'yapilacak_isler.db'

# Veritabanı bağlantısı oluşturma
def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# tablo oluşturma
def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS yapilacak_is (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dt TEXT NOT NULL,
            durum INTEGER DEFAULT 0,
            yapilacak_is TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    print(f"'{DB_NAME} oluşturuldu ve tablo hazır! .")
    
 # ugulama başlarken veritabını kontrol et 
init_db() 


@app.route('/')
def ana_sayfa():
    return render_template('index.html')

# Listeleem / Get , yapilacak_is , list 
@app.route('/yapilacak_is/list', methods=['GET'])
def get_yapilacak_isler():
    conn = get_db_connection()
    yapilacak_isler = conn.execute('SELECT * FROM yapilacak_is ORDER BY id DESC').fetchall()
    conn.close()
    
    # veritabanından gelen görevleri JSON formatına dönüştür
    liste = []
    for g in yapilacak_isler:
        liste.append({
            'id': g['id'],
            'dt': g['dt'],
            'yapilacak_is': g['yapilacak_is'],
            'durum': bool(g['durum'])
        })
            
    return jsonify(liste) ,200
       #jsonify = JavaScript'in anlayacağı JSON formatına (string'e) çevirir.
    
    #  Ekleme / Post , yapilacak_is , add
@app.route('/yapilacak_is/add', methods=['POST'])
def add_yapilacak_is():

    data = request.json

    if not data:
        return jsonify({'error': 'Veri gelmedi.'}), 400

    dt = data.get('dt')
    yapilacak_is_metni = data.get('yapilacak_is', '').strip()

    if not dt:
        return jsonify({'error': 'dt alanı zorunlu.'}), 400

    if not yapilacak_is_metni:
        return jsonify({'error': 'Yapılacak iş metni boş olamaz.'}), 400

    conn = get_db_connection()
    conn.execute(
        'INSERT INTO yapilacak_is (dt, yapilacak_is, durum) VALUES (?, ?, 0)',
        (dt, yapilacak_is_metni)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': 'Görev başarıyla eklendi!'}), 201

# Silme / Delete , yapilacak_is , delete
@app.route('/yapilacak_is/delete', methods=['POST'])
def yapilacak_is_delete():
    data = request.json
    yapilacak_is_id = data.get('id') 
    
    conn = get_db_connection()
    conn.execute('DELETE FROM yapilacak_is WHERE id = ?', (yapilacak_is_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Görev başarıyla silindi!'}) ,200

  # Güncelleme / Put , yapilacak_is , update
@app.route('/yapilacak_is/update', methods=['POST'])
def update_yapilacak_is():
    data = request.json
    yapilacak_is_id = data.get('id')  
    yeni_dt = data.get('dt')
    yeni_metin = data.get('yapilacak_is')
    
    conn = get_db_connection()
    conn.execute('UPDATE yapilacak_is SET dt = ?, yapilacak_is = ? WHERE id = ?', (yeni_dt, yeni_metin, yapilacak_is_id))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Görev başarıyla güncellendi!'}) ,200

  # Tik atma
# app.py'de toggle_yapilacak_is fonksiyonunu bul ve böyle değiştir:

@app.route('/yapilacak_is/toggle', methods=['POST'])
def toggle_yapilacak_is():
    data = request.json
    id = data.get('id')  # ID'yi değişkene alalım
    yeni_durum = 1 if data.get('durum') else 0
    
    # --- İŞTE BU SATIRI EKLE ---
    print(f"👀 DİKKAT: Görev ID: {id} için durum değişti! Yeni Durum: {yeni_durum}")
    # ---------------------------

    conn = get_db_connection()
    conn.execute('UPDATE yapilacak_is SET durum = ? WHERE id = ?', (yeni_durum, id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Durum güncellendi'}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)