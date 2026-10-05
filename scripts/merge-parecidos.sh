#!/bin/bash
# Unificación de los grupos de jugadores 'parecidos' (decisiones confirmadas).
# Correr desde la carpeta del proyecto:  bash scripts/merge-parecidos.sh
# Cada comando desactiva las fichas sobrantes (no las borra) y mueve puntos, equipos e inscripciones a la que queda.
# El nombre entre comillas (--name) es el que va a quedar en todo el sitio.
# Se detiene en el primer error (set -e). Si se corta, se puede volver a correr: lo ya unificado no vuelve a aparecer.

set -e

# 1. Rodriguez Cecilia (insc 0, pts 0, equipos 1) | Rodriguez Cecilia Andrea (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge a9ce120f-ff6e-4f7d-824e-aad1b74566bb,88f78c54-2bdb-4fc8-ba8f-de32f2283da9 --name "Rodriguez Cecilia Andrea"

# 2. Rozas Maria Julieta (insc 0, pts 0, equipos 2) | Rozas Julieta (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 1ed6a359-3950-45a8-b7ef-0c30c59811bd,13ac9534-f345-4116-ad09-2398fde52614 --name "Rozas Maria Julieta"

# 3. Benitez Adriana (insc 0, pts 0, equipos 2) | Benitez Adriana Paola (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 7cfdd673-bed0-4c97-b5cc-a180b2eb8571,e8076552-75f1-47e9-afb4-a42db43370fc --name "Benitez Adriana"

# 4. Palla Laura Griselda (insc 0, pts 0, equipos 1) | Palla Griselda (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 7279cca5-5ae7-40d6-bbd0-28df77d9799e,db3417f8-2583-4c00-9a16-6e27fd3bb3c8 --name "Palla Laura Griselda"

# 5. Rebollo Prats Guadalupe (insc 0, pts 0, equipos 2) | Pratts Guadalupe (insc 0, pts 0, equipos 1) | Guadalupe Prats (insc 0, pts 800, equipos 0)
npm run dedupe:players -- --merge 24e009d8-849a-467f-8222-87b1f77e886f,f53325d5-30c6-47c0-a65d-d8a45e756f1a,27e20cc5-57c7-4c8d-a158-6405c72f11bd --name "Rebollo Prats Guadalupe"

# 6. Cordoba Maria Mercedes (insc 0, pts 0, equipos 2) | Cordoba Mercedes (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 554269a3-fe02-44a0-a885-a750d3720c9f,9d7780cb-1758-49a8-90fa-a02ed56f1a77 --name "Cordoba Maria Mercedes"

# 7. Zacchi Carolina (insc 0, pts 0, equipos 2) | Carolina Sacchi (insc 1, pts 800, equipos 0)
npm run dedupe:players -- --merge 37379bb0-5046-44e0-bc5d-cbb1f4b1d08c,fb0a23da-9102-472b-abb1-a638ac6dbcf8 --name "Sacchi Carolina"

# 8. Siangiacomo Daniela Andrea (insc 0, pts 0, equipos 1) | Sangiacomo Daniela (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 28a0602f-cfa8-4dc5-a7a3-499ca03b96b3,4192af56-2fbb-4a75-823f-d6bb7dd47e76 --name "Sangiacomo Daniela Andrea"

# 9. Udaquiola Julia (insc 0, pts 0, equipos 1) | Udaquiolla Julia (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 155c7c84-5097-4856-8ef7-9fd76936d058,4b2dae2a-7b03-4634-ab75-935e2fe5fe3c --name "Udaquiolla Julia"

# 10. Vallejo Daniela (insc 0, pts 0, equipos 2) | Vallejos Daniela (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge db80fab8-5f71-40a2-9c46-cdfcc3bb123a,04a84da1-c78f-4caf-9b2c-2d1ad6bf239a --name "Vallejo Daniela"

# 11. Poroni Gisela (insc 0, pts 0, equipos 1) | Porroni Gisela (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 427e8293-7740-4dfd-a071-b97aa73f8b5a,bd43f0c6-e311-4310-8b6d-3c91f0f2b8e2 --name "Porroni Gisela"

# 12. Bellotte Mijal (insc 0, pts 0, equipos 2) | Bellote Mijal (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 4d1567eb-dd70-4711-acdd-8a63a835a3ae,23b36899-76d4-4c76-a53b-889886a9cf05 --name "Bellotte Mijal"

# 13. Mucci Silvia (insc 0, pts 0, equipos 1) | Mucci Silvia Mirian (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 5121972a-9b34-421e-892d-9cb42870e8ba,89086f8f-7650-4e0e-b98c-aa4994a0a023 --name "Mucci Silvia Mirian"

# 14. Di Fonzo Veronica (insc 0, pts 0, equipos 2) | Di Fonzio Verónica (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge afa0bb0b-bc0b-4876-a4b4-0b7b91872f63,18ba054c-bff1-4457-8b44-33ad97bfedeb --name "Di Fonzo Veronica"

# 15. Tajes Kevin Daniel (insc 0, pts 0, equipos 1) | Tajes Daniel Alberto (insc 0, pts 0, equipos 1) | Tajes Daniel (insc 0, pts 0, equipos 1) | Kevin Tajes (insc 1, pts 0, equipos 0)
# Son DOS personas distintas: Tajes Kevin Daniel y Tajes Daniel Alberto.
npm run dedupe:players -- --merge 449bf271-73c4-409f-9d19-b44eab218c01,fb7c6cbf-5435-4f1f-a42f-1003b2ebc084 --name "Tajes Kevin Daniel"
# PENDIENTE: la ficha 'Tajes Daniel' ¿es Daniel Alberto o Kevin Daniel? Si es Daniel Alberto, sacale el '#':
# npm run dedupe:players -- --merge 7bc538fc-05d9-494a-a496-29ed7cf4ba7a,30581368-d730-4ef5-b5c8-79bca360dfaa --name "Tajes Daniel Alberto"

# 16. Andre Christian (insc 0, pts 0, equipos 2) | Andre Cristian (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 46270c20-51e6-4e96-9c24-db40d3d7f6a2,cc281b48-3e83-4095-909e-f7db837b7ec6 --name "Andre Christian"

# 17. Diaz Rodolfo Javier (insc 0, pts 0, equipos 1) | Diaz Rodolfo (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 33af6429-de86-49e3-b6c6-a48c3fb79940,0ad19131-3b33-4259-aac6-3714ffb72453 --name "Diaz Rodolfo Javier"

# 18. Zacaria Cesar (insc 0, pts 0, equipos 2) | Cesar Zacarias (insc 1, pts 200, equipos 0)
npm run dedupe:players -- --merge ce1e36c6-bd99-4237-a245-91947f86f055,ad568ef2-e1a1-4f2d-ba66-45110399d8e2 --name "Zacaria Cesar"

# 19. Comellini Matias Martin (insc 0, pts 0, equipos 1) | Comellini Matias (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge ed80aa5a-401c-488b-adfe-01969d33fea2,38316542-8f20-426a-b7d7-dbde50da53d3 --name "Comellini Matias Martin"

# 20. Scagliarini Matias (insc 0, pts 0, equipos 1) | Scaglarini Matias (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge f761b858-2871-4e9c-b4f9-6e77db4b95dc,634e63d4-0f98-44b7-82ee-f03a717bd902 --name "Scagliarini Matias"

# 21. Tapia Christian (insc 0, pts 0, equipos 1) | Tapia Cristian (insc 0, pts 0, equipos 1) | Christian Tapia (insc 0, pts 400, equipos 0)
npm run dedupe:players -- --merge 0d234db2-2a7e-4269-9902-3799e1c0d55c,dcf44705-eede-4656-b98b-d6c7dcdf90ef,6c0a8ac5-f7f8-4a06-8c52-9716f0c6f397 --name "Tapia Christian"

# 22. Martinez Ariel Hernan (insc 0, pts 0, equipos 1) | Martinez Ariel (insc 0, pts 0, equipos 1) | Martínez Ariel (insc 0, pts 0, equipos 1) | Martínez Ariel (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 6b8819a4-973f-4f13-8288-945ff9025608,a4d2fc4a-fe56-40e4-8f8e-c56208df9e82,75d1caf5-f0bf-4388-b430-e65a3c1cec9e,f6fa4af7-3b8f-4dc7-88e2-9d700f918599 --name "Martinez Ariel Hernan"

# 23. Abdusetir Ceforglio Juan Manuel (insc 0, pts 0, equipos 2) | Abdusetir Ceforglio Juan Manual (insc 0, pts 0, equipos 2) | Abdusetir Juan Manuel (insc 0, pts 0, equipos 1) | Manuel Abdusetir (insc 0, pts 1300, equipos 0)
npm run dedupe:players -- --merge 6ebeeb32-265b-4118-a4c0-b3c7f6ad0493,48a12b93-56fe-4299-b760-1dbdb8b0b311,fdacae51-2c9d-4459-81d7-4d526f370685,cd4319a6-7201-466f-aa8a-08f0f7a82add --name "Abdusetir Juan Manuel"

# 24. Gallego Mariela (insc 0, pts 0, equipos 1) | Gallegos Mariela (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge b3f1aed0-9310-4da2-bc99-b20ce9f7b2b1,3cde9630-22e6-41d7-9d13-a7d3117e0151 --name "Gallegos Mariela"

# 25. Bruzzera Victoria (insc 0, pts 0, equipos 1) | Victoria Bruzera (insc 0, pts 2000, equipos 0)
npm run dedupe:players -- --merge e24d2b5e-9dc7-4863-bbd2-281102a09988,a25025ce-b3c6-42c0-8fea-90ce776e7148 --name "Bruzera Victoria"

# 26. Miranda Eugenia (insc 0, pts 0, equipos 1) | Miranda Maria Eugenia (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 569f9be5-b7d8-44b3-8e90-7de670e71cc0,3c0b0267-5d89-4a3f-be0c-cbba5004713f --name "Miranda Maria Eugenia"

# 27. Fabian Leiter (insc 7, pts 1950, equipos 0) | Leite Fabian (insc 0, pts 0, equipos 1) | Leiter Fabian (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 93faf3b5-f121-4616-ad1c-05887275931b,9f380903-06af-4d47-b40e-cca9773e0674,fcc23b45-83f0-4ac4-9e82-1214680d275c --name "Leiter Fabian"

# 28. Llanos Jeronimo (insc 0, pts 0, equipos 1) | Jeronimo Llanos Boscato (insc 0, pts 400, equipos 0) | Jeronimo Llanos (insc 0, pts 1300, equipos 0)
npm run dedupe:players -- --merge cbe85a22-836b-4125-8479-c8941f382494,9a75b4cd-c063-429b-9557-f7758bd98452,b2935436-e7fd-4194-bb23-37452da58eae --name "Llanos Boscato Jeronimo"

# 29. Cardasi Nestor Daniel (insc 0, pts 0, equipos 1) | Cardaci Nestor Daniel (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge 441e5556-2b8c-42ee-b04a-cbd55445423c,073fd5d9-12e7-49b8-b697-0bfddb7abfaf --name "Cardasi Nestor Daniel"

# 30. Martin Di Perna (insc 1, pts 200, equipos 0) | Di Perna Martin Gabriel (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge eae1af4b-2fd8-4d99-9018-72a3e50b94f2,3715fe2a-03b5-4982-9095-fce4bb21a954 --name "Di Perna Martin Gabriel"

# 31. Damian Scaricaciottoli (insc 1, pts 100, equipos 0) | Scaricasiottoli Damian (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge bcd944f2-3a97-45f3-95d8-2464e59053f2,a222f280-65fb-4475-931a-620f40067c22 --name "Scaricasiottoli Damian"

# 32. Minguillon Cecilia (insc 0, pts 0, equipos 1) | Minguillon María Cecilia (insc 0, pts 0, equipos 1)
npm run dedupe:players -- --merge d83d3dec-1220-47b8-823a-7b1c9372879b,1617803b-71c5-49c1-a465-9f32cf5f971f --name "Minguillon María Cecilia"

# 33. Kevin Hergeder (insc 3, pts 400, equipos 0) | Kevin Hergender (insc 1, pts 150, equipos 0)
npm run dedupe:players -- --merge a4059281-1661-463e-b103-4f1f514231c6,7742394c-c930-4794-a698-3871b0c7794c --name "Hergeder Kevin"

# 34. Mariano Andres Klug (insc 1, pts 200, equipos 0) | Mariano Klug (insc 1, pts 50, equipos 0)
npm run dedupe:players -- --merge e70c0e0c-6741-4b6b-923b-71d2192fe4ce,403a95f4-1f5d-4d73-be27-8240be120b42 --name "Klug Mariano Andres"

# 35. compa Silvana (insc 0, pts 1300, equipos 0) | Compa Silvana2 (insc 0, pts 800, equipos 0)
npm run dedupe:players -- --merge 3f9a64c3-3e60-4e03-b76a-4486730400d0,fe422e63-8bf6-4acb-9d3d-a2117499f9ab --name "Compa Silvana"
