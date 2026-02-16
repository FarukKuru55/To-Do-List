
        const API_URL = "/yapilacak_is";
        let yapilacak_isler = [];
        let duzenlenecekId = null;

        const btnKaydet = document.getElementById('btnKaydet');
        const inputyapilacak_is = document.getElementById('tskName');
        const inputTarih = document.getElementById('tskData');
        const liste = document.getElementById('yapilacak_isListesi');

        document.addEventListener("DOMContentLoaded", function() {
            verileriGetir();
        });

        async function verileriGetir() {
            try {
                const cevap = await fetch(API_URL + "/list");
                yapilacak_isler = await cevap.json();
                listeyiCiz();
            } catch (hata) {
                console.log(hata);
                alert("Veriler çekilemedi! Python sunucusu açık mı?");
            }
        }

        btnKaydet.addEventListener('click', async function() {
            const yapilacak_isMetni = inputyapilacak_is.value;
            const tarihMetni = inputTarih.value;

            if (yapilacak_isMetni === "" || tarihMetni === "") { 
                alert("Lütfen alanları doldur!"); return; 
            }

            const veriPaketi = {
                dt: new Date(tarihMetni).toISOString(),
                yapilacak_is: yapilacak_isMetni
            };

            if (duzenlenecekId === null) {
                await fetch(API_URL + "/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(veriPaketi)
                });
            } else {
                veriPaketi.id = duzenlenecekId;
                await fetch(API_URL + "/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(veriPaketi)
                });
                duzenlenecekId = null;
            }

            verileriGetir();
            inputyapilacak_is.value = "";
            inputTarih.value = "";
            bootstrap.Modal.getOrCreateInstance(document.getElementById('yeniyapilacak_isModal')).hide();
        });
        
        // --- DÜZELTME 1: İsimler Eşlendi ---
        async function toggleTamam(id, suankiDurum) {
            const yeniDurum = !suankiDurum;
            
            // Ekranda hemen güncelleyelim (F5 atmış gibi olmasın diye)
            const yapilacak_is = yapilacak_isler.find(g => g.id === id);
            if(yapilacak_is) yapilacak_is.durum = yeniDurum;
            listeyiCiz();

            // Arka planda sunucuya gönderelim
            await fetch(API_URL + "/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // BURASI HATALIYDI: 'tamam' yazıyordun, 'durum' olmalı!
                body: JSON.stringify({ id: id, durum: yeniDurum })
            });
            // verileriGetir(); // Buna gerek kalmadı, elle güncelledik yukarıda.
        }

        function listeyiCiz() {
            liste.innerHTML = "";
            if (yapilacak_isler.length === 0) {
                liste.innerHTML = `<div class="text-center text-muted mt-5"><p class="fs-4">📭</p><p>Veritabanı boş.</p></div>`;
                return;
            }

            yapilacak_isler.sort((a, b) => new Date(a.dt) - new Date(b.dt));

            yapilacak_isler.forEach((g) => {
                const kalan = kalanGunHesapla(g.dt);
                let badgeClass = "bg-secondary";
                let kalanMetin = kalan + " gün";

                if (kalan < 0) { badgeClass = "bg-dark"; kalanMetin = "Süresi geçti"; }
                else if (kalan <= 3) { badgeClass = "bg-danger"; if(kalan===0) kalanMetin="Bugün"; }
                else if (kalan <= 7) { badgeClass = "bg-warning text-dark"; }
                else { badgeClass = "bg-success"; }

                // --- DÜZELTME 2: g.tamam YERİNE g.durum YAZILDI ---
                // Python bize 'durum' gönderiyor, 'tamam' değil.
                const tamamClass = g.durum ? "completed" : "";
                const checkedDurum = g.durum ? "checked" : "";

                liste.innerHTML += `
                <div class="list-group-item d-flex justify-content-between align-items-center p-3">
                    <div class="d-flex align-items-center">
                        <input type="checkbox" class="form-check-input me-3 big-check" 
                            ${checkedDurum} 
                            onchange="toggleTamam(${g.id}, ${g.durum})">

                        <span class="${tamamClass}">
                            ${guvenliYazi(g.yapilacak_is)}<br>
                            <small class="text-muted">
                                📅 ${new Date(g.dt).toLocaleDateString('tr-TR')} 
                                <span class="badge ${badgeClass} ms-2">${kalanMetin}</span>
                            </small>
                        </span>
                    </div>
                    <div>
                        <button class="btn btn-warning btn-sm me-2" onclick="duzenleModunuAc(${g.id}, '${guvenliYazi(g.yapilacak_is)}', '${g.dt}')">Düzenle</button>
                        <button class="btn btn-outline-danger btn-sm" onclick="sil(${g.id})">Sil</button>
                    </div>
                </div>`;
            });
        }

        async function sil(id) {
            if (confirm("Bu görevi veritabanından silmek istediğine emin misin?")) {
                await fetch(API_URL + "/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: id })
                });
                verileriGetir();
            }
        }

        function duzenleModunuAc(id, yapilacak_is, tarih) {
            duzenlenecekId = id;
            inputyapilacak_is.value = yapilacak_is;
            inputTarih.value = new Date(tarih).toISOString().slice(0, 16);
            bootstrap.Modal.getOrCreateInstance(document.getElementById('yeniyapilacak_isModal')).show();
        }

        function yeniyapilacak_isModunuAc() {
            duzenlenecekId = null;
            inputyapilacak_is.value = "";
            inputTarih.value = "";
        }

        function guvenliYazi(metin) {
            if (!metin) return "";
            return metin.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        function kalanGunHesapla(tarihStr) {
            const hedef = new Date(tarihStr);
            const simdi = new Date();
            hedef.setHours(0, 0, 0, 0);
            simdi.setHours(0, 0, 0, 0);
            return Math.round((hedef - simdi) / (1000 * 60 * 60 * 24));
        }