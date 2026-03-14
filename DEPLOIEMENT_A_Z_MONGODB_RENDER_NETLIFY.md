# Deploiement LearnHub A a Z (MongoDB Atlas + Render + Netlify) - 100% gratuit

Ce guide deploie **backend + frontend + base de donnees** avec des offres gratuites:

- Base de donnees: **MongoDB Atlas (M0 Free)**
- Backend Node/Express: **Render (Free Web Service)**
- Frontend React/Vite: **Netlify (Free)**

Objectif: avoir une plateforme fonctionnelle en ligne et que les ameliorations arrivent automatiquement apres chaque `git push`.

---

## 0. Prerequis

Tu dois avoir:

1. Un compte GitHub (gratuit)
2. Un compte MongoDB Atlas (gratuit)
3. Un compte Render (gratuit)
4. Un compte Netlify (gratuit)
5. Ton projet LearnHub versionne sur Git et pousse sur GitHub

Commandes utiles (depuis la racine `learnhub`):

```bash
git init
git add .
git commit -m "Initial LearnHub"
git branch -M main
git remote add origin https://github.com/<TON_USER>/<TON_REPO>.git
git push -u origin main
```

---

## 1. Creer la base MongoDB Atlas (gratuit)

### 1.1 Creer le cluster

1. Connecte-toi a https://www.mongodb.com/atlas
2. Cree un projet (ex: `LearnHub`)
3. Clique `Build a Database`
4. Choisis `M0 Free`
5. Choisis un provider/region (AWS, region proche)
6. Clique `Create`

### 1.2 Creer un utilisateur BD

1. Menu `Database Access`
2. `Add New Database User`
3. Username: `learnhub_user`
4. Password: genere un mot de passe fort (note-le)
5. Role: `Read and write to any database`
6. Save

### 1.3 Autoriser l acces reseau

1. Menu `Network Access`
2. `Add IP Address`
3. Choisis `Allow Access from Anywhere` (0.0.0.0/0)
4. Save

### 1.4 Recuperer la connection string

1. Menu `Database` -> `Connect` -> `Drivers`
2. Copie l URI du type:

```text
mongodb+srv://learnhub_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/learnhub?retryWrites=true&w=majority
```

3. Remplace `<PASSWORD>` par le vrai mot de passe.

---

## 2. Deployer le backend sur Render (gratuit)

### 2.1 Creer le service

1. Connecte-toi a https://render.com
2. `New +` -> `Web Service`
3. Connecte ton repo GitHub `learnhub`
4. Configure:

- Name: `learnhub-api` (ou ton nom)
- Root Directory: `server`
- Runtime: `Node`
- Branch: `main`
- Build Command: `npm install`
- Start Command: `npm start`
- Instance Type: **Free**
- Auto-Deploy: **Yes**

### 2.2 Variables d environnement Render

Ajoute ces variables:

- `NODE_ENV` = `production`
- `PORT` = `10000` (optionnel, Render fournit deja PORT)
- `MONGO_URI` = ton URI Atlas
- `JWT_SECRET` = une cle secrete tres forte
- `JWT_EXPIRES_IN` = `7d`
- `CLIENT_URL` = URL Netlify (tu la mettras apres deploy frontend)
- `CLIENT_URLS` = liste supplementaire separee par virgule si besoin (optionnel)

Exemple:

```text
CLIENT_URL=https://learnhub-app.netlify.app
CLIENT_URLS=https://deploy-preview-1--learnhub-app.netlify.app,https://deploy-preview-2--learnhub-app.netlify.app
```

### 2.3 Deployer

1. Clique `Create Web Service`
2. Attends la fin du build
3. Note ton URL backend:

```text
https://learnhub-api.onrender.com
```

4. Teste sante API:

```text
https://learnhub-api.onrender.com/api/v1/health
```

Tu dois voir `status: OK`.

---

## 3. Deployer le frontend sur Netlify (gratuit)

### 3.1 Creer le site

1. Connecte-toi a https://www.netlify.com
2. `Add new site` -> `Import an existing project`
3. Choisis ton repo GitHub `learnhub`
4. Configure:

- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `dist`

### 3.2 Variables d environnement Netlify

Ajoute:

- `VITE_API_BASE_URL` = `https://learnhub-api.onrender.com/api/v1`
- `VITE_API_ORIGIN` = `https://learnhub-api.onrender.com`

Puis deploie.

### 3.3 Recuperer URL frontend

Apres deploy, Netlify donne une URL:

```text
https://<ton-site>.netlify.app
```

Copie-la.

---

## 4. Finaliser CORS backend (Render)

Retourne dans Render -> service backend -> `Environment`:

1. Mets `CLIENT_URL` = ton URL Netlify
2. Si tu utilises Deploy Preview Netlify, ajoute `CLIENT_URLS`
3. `Save changes`
4. Render redeploie automatiquement

---

## 5. Creer / promouvoir le compte admin en production

L interface register ne cree pas d admin directement.

### Option simple

1. Cree le compte via `/register` (student ou instructor)
2. Promeus ce compte en `admin` via `mongosh` sur Atlas:

```bash
mongosh "<MONGO_URI_ATLAS>" --eval 'db.users.updateOne({ email: "tonadmin@email.com" }, { $set: { role: "admin", isActive: true } })'
```

---

## 6. Pourquoi les ameliorations seront immediates apres deploy

Tu as maintenant le CI/CD gratuit:

1. `git add .`
2. `git commit -m "amelioration X"`
3. `git push origin main`

Automatiquement:

- Render redeploie le backend (si changements backend)
- Netlify redeploie le frontend (si changements frontend)

Pas besoin de redeployer manuellement.

---

## 7. Checklist de verification finale

1. Ouvre le frontend Netlify
2. Cree un compte instructor
3. Cree un cours + image + lecons
4. Connecte admin et valide le cours
5. Connecte student et inscris-toi
6. Ouvre le cours et marque une lecon terminee
7. Verifie que:
- la progression se met a jour
- les images s affichent
- le texte formate (listes, paragraphes) s affiche correctement

---

## 8. Limitations gratuites importantes

1. **Render Free** peut "sleep" apres inactivite (premiere requete plus lente)
2. **MongoDB Atlas M0** a des limites de quota
3. **Uploads locaux Render**:
- les fichiers dans `server/uploads` peuvent etre perdus apres redemarrage/deploy (stockage ephemere)
- pour la persistance des fichiers en gratuit, utilise un stockage externe gratuit (ex: Cloudinary Free)

---

## 9. En cas de probleme

1. Verifie les variables d environnement sur Render et Netlify
2. Verifie `MONGO_URI` (mot de passe encode si caracteres speciaux)
3. Verifie CORS (`CLIENT_URL`, `CLIENT_URLS`)
4. Regarde les logs:
- Render -> `Logs`
- Netlify -> `Deploy logs`

---

## 10. Resume ultra court

1. Atlas M0 -> cree cluster + user + URI
2. Render -> deploy `server`, mets env vars
3. Netlify -> deploy `client`, mets `VITE_API_BASE_URL`
4. Mets `CLIENT_URL` (Netlify) dans Render
5. Push GitHub -> deploiement automatique backend + frontend

