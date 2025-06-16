# ecommerce-api
# E-commerce API

Ett REST API för en e-handelsapplikation byggd med Node.js, Express och PostgreSQL.

## Funktioner

- Användarregistrering och inloggning (JWT)
- CRUD för produkter
- CRUD för användare
- CRUD för varukorg
- Checkout och orderhantering
- Swagger-dokumentation

## Kom igång

### Klona projektet

```bash
git clone https://github.com/ditt-användarnamn/ecommerce-api.git
cd ecommerce-api
```

### Installera beroenden

```bash
npm install
```

### Skapa och fyll i `.env`-fil

```env
DB_USER=****
DB_PASSWORD=****
DB_NAME=ecommerce
DATABASE_URL=postgres://****:****@localhost:5432/ecommerce
JWT_SECRET=dinhemlighetnyckel
JWT_EXPIRES_IN=2h
PORT=4000
NODE_ENV=production
```

### Skapa databas och tabeller

Skapa en PostgreSQL-databas med namnet `ecommerce` och kör dina migrations/SQL-skript för att skapa tabeller.

### Starta servern

```bash
npm start
```

### API-dokumentation

Swagger finns på:  
[http://localhost:4000/api-docs](http://localhost:4000/api-docs)

## Projektstruktur

```
src/
  controllers/
  middleware/
  routes/
  db.js
  index.js
  swagger.js
.env
.gitignore
README.md
```

## Exempel på endpoints

- `POST /api/auth/register` – Registrera användare
- `POST /api/auth/login` – Logga in
- `GET
