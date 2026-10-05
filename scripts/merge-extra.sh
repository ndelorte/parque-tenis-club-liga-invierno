#!/bin/bash
# Segunda tanda: nombres con letras cambiadas de lugar (decisiones confirmadas).
# Correr desde la carpeta del proyecto:  bash scripts/merge-extra.sh
# Se detiene en el primer error (set -e); si se corta se puede volver a correr.

set -e

# 1. Cesa Maria Paula (insc 0, pts 0, equipos 1) | Cesar Maria Paula (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge f31b14ce-c3d5-4c3f-a40e-917b82443bc9,f5024246-9409-48ee-8ebf-dd57ec781ecb --name "Cesar Maria Paula"

# 2. Giuliano Carola (insc 1, pts 800, equipos 1) | Guiliano Carola (insc 0, pts 0, equipos 2)
npm run dedupe:players -- --merge 846da507-36ee-4a61-8552-58770dfcae75,2be706fc-6b4f-4430-917a-2d7d346da991 --name "Giuliano Carola"

# 3. Minguillon María Cecilia (insc 0, pts 0, equipos 2) | Mari Cecilia (insc 0, pts 0, equipos 1)
# NO se unifican: son personas distintas.

# 4. Alejandra Botarri (insc 0, pts 200, equipos 0) | Bottari Alejandra (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge bbbab950-da33-489c-8dd3-9aade6e90268,a33dd220-42ea-44bd-acee-4e05f454f848 --name "Bottari Alejandra"

# 5. Mahle Laura (insc 0, pts 0, equipos 1) | Malhe Laura (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 93166ff7-3842-4ae7-87ba-01363458f084,f46d7646-84b2-415d-84f7-486ea771f85e --name "Mahle Laura"

# 6. Christian Fernandez (insc 1, pts 400, equipos 0) | Fernandez Cristhian Javier (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 8a2ee91a-dd62-4148-8ac4-297579f23222,2dc13fc8-1f5a-4821-9964-f32bd5e521a7 --name "Fernandez Christian Javier"

# 7. Marcos Kilmunda (insc 1, pts 1450, equipos 0) | Klimunda Marcos (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge e6bc5646-bf7a-4295-90e6-32932616b429,53956e54-6729-4500-a29d-da36479b0546 --name "Kilmunda Marcos"

# 8. Loaiza Juan (insc 4, pts 300, equipos 2) | Juan Laoiza (insc 0, pts 800, equipos 0)
npm run dedupe:players -- --merge 9e508bf5-9b7b-401c-8301-a7d4194e9215,e5810c82-9e30-4e31-af79-fb30dd9ea4f4 --name "Loaiza Juan"
