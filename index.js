// On importe Express pour créer le serveur et les routes
const express = require("express");

// fs sert à lire et écrire des fichiers sur le disque
const fs = require("fs");

// path permet de gérer les chemins de fichiers proprement
const path = require("path");

// Création de l'application Express
const app = express();

// Port d'écoute du serveur
const PORT = 3000;

// =========================
// Chemins vers les fichiers JSON
// =========================

// __dirname correspond au dossier de ce fichier
// Les données sont stockées dans le dossier "data"
const equipesPath = path.join(__dirname, "data", "equipes.json");
const joueursPath = path.join(__dirname, "data", "joueurs.json");

// =========================
// Middleware
// =========================

// Permet de lire le JSON envoyé dans le body des requêtes
app.use(express.json());

// =========================
// Fonctions pour les équipes
// =========================

// Lit le fichier equipes.json et retourne un tableau
function readEquipes() {
  const raw = fs.readFileSync(equipesPath, "utf-8");

  // Si le fichier est vide, on retourne un tableau vide
  if (!raw.trim()) return [];

  return JSON.parse(raw);
}



// Génère un nouvel id pour une équipe
function nextEquipeId(equipes) {
  let max = 0;

  for (const e of equipes) {
    if (Number(e.id) > max) {
      max = Number(e.id);
    }
  }

  return max + 1;
}

// Génère un nouvel id pour un joueur
function nextJoueurId(joueurs) {
  let max = 0;

  for (const j of joueurs) {
    if (Number(j.id) > max) {
      max = Number(j.id);
    }
  }

  return max + 1;
}

// =========================
// Fonctions pour les joueurs
// =========================

// Lit le fichier joueurs.json
function readJoueurs() {
  const raw = fs.readFileSync(joueursPath, "utf-8");
  if (!raw.trim()) return [];
  return JSON.parse(raw);
}

// Écrit les joueurs dans le fichier JSON
function writeJoueurs(joueurs) {
  fs.writeFileSync(joueursPath, JSON.stringify(joueurs, null, 2), "utf-8");
}

// Écrit le tableau d'équipes dans le fichier JSON
function writeEquipes(equipes) {
  fs.writeFileSync(equipesPath, JSON.stringify(equipes, null, 2), "utf-8");
}


// =========================
// Route de test
// =========================

// Permet de vérifier que l'API fonctionne
app.get("/", (req, res) => {
  res.send("API JSON is running");
});

// =========================
// Routes équipes (CRUD)
// =========================

// Récupérer toutes les équipes
app.get("/equipes", (req, res) => {
  res.json(readEquipes());
});

// Récupérer une équipe par id
app.get("/equipes/:id", (req, res) => {
  const id = Number(req.params.id);
  const equipe = readEquipes().find(e => Number(e.id) === id);

  if (!equipe) {
    return res.status(404).json({ error: "Equipe not found" });
  }

  res.json(equipe);
});

// Ajouter une nouvelle équipe
app.post("/equipes", (req, res) => {
  const { name, country } = req.body;

  if (!name || !country) {
    return res.status(400).json({ error: "name and country required" });
  }

  const equipes = readEquipes();
  const newEquipe = {
    id: nextEquipeId(equipes),
    name,
    country
  };

  equipes.push(newEquipe);
  writeEquipes(equipes);

  res.status(201).json(newEquipe);
});

// Modifier une équipe
app.put("/equipes/:id", (req, res) => {
  const id = Number(req.params.id);
  const equipes = readEquipes();
  const index = equipes.findIndex(e => Number(e.id) === id);

  if (index === -1) {
    return res.status(404).json({ error: "Equipe not found" });
  }

  // On met à jour seulement les champs envoyés
  if (req.body.name !== undefined) {
    equipes[index].name = req.body.name;
  }

  if (req.body.country !== undefined) {
    equipes[index].country = req.body.country;
  }

  writeEquipes(equipes);
  res.json(equipes[index]);
});

// Supprimer une équipe
app.delete("/equipes/:id", (req, res) => {
  const id = Number(req.params.id);
  const equipes = readEquipes();
  const result = equipes.filter(e => Number(e.id) !== id);

  if (result.length === equipes.length) {
    return res.status(404).json({ error: "Equipe not found" });
  }

  writeEquipes(result);
  res.status(204).send();
});

// =========================
// Routes joueurs
// =========================

// Récupérer tous les joueurs
app.get("/joueurs", (req, res) => {
  res.json(readJoueurs());
});

// Ajouter un joueur
app.post("/joueurs", (req, res) => {
  const { idEquipe, nom, numero, poste } = req.body;

  if (idEquipe === undefined || !nom || numero === undefined || !poste) {
    return res.status(400).json({ error: "idEquipe, nom, numero, poste required" });
  }

  const joueurs = readJoueurs();
  const newJoueur = {
    id: nextJoueurId(joueurs),
    idEquipe: Number(idEquipe),
    nom,
    numero: Number(numero),
    poste
  };

  joueurs.push(newJoueur);
  writeJoueurs(joueurs);

  res.status(201).json(newJoueur);
});

// Modifier un joueur
app.put("/joueurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const joueurs = readJoueurs();
  const index = joueurs.findIndex(j => Number(j.id) === id);

  if (index === -1) {
    return res.status(404).json({ error: "Joueur not found" });
  }

  if (req.body.idEquipe !== undefined) {
    joueurs[index].idEquipe = Number(req.body.idEquipe);
  }
  if (req.body.nom !== undefined) {
    joueurs[index].nom = req.body.nom;
  }
  if (req.body.numero !== undefined) {
    joueurs[index].numero = Number(req.body.numero);
  }
  if (req.body.poste !== undefined) {
    joueurs[index].poste = req.body.poste;
  }

  writeJoueurs(joueurs);
  res.json(joueurs[index]);
});

// Supprimer un joueur
app.delete("/joueurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const joueurs = readJoueurs();
  const result = joueurs.filter(j => Number(j.id) !== id);

  if (result.length === joueurs.length) {
    return res.status(404).json({ error: "Joueur not found" });
  }

  writeJoueurs(result);
  res.status(204).send();
});

// =========================
// Relations équipes / joueurs
// =========================

// Récupérer les joueurs d'une équipe
app.get("/equipes/:id/joueurs", (req, res) => {
  const idEquipe = Number(req.params.id);
  const joueurs = readJoueurs().filter(j => Number(j.idEquipe) === idEquipe);
  res.json(joueurs);
});

// Récupérer l'équipe d'un joueur
app.get("/joueurs/:id/equipe", (req, res) => {
  const idJoueur = Number(req.params.id);
  const joueur = readJoueurs().find(j => Number(j.id) === idJoueur);

  if (!joueur) {
    return res.status(404).json({ error: "Joueur not found" });
  }

  const equipe = readEquipes().find(e => Number(e.id) === Number(joueur.idEquipe));

  if (!equipe) {
    return res.status(404).json({ error: "Equipe not found" });
  }

  res.json(equipe);
});

// Recherche d'un joueur par nom
app.get("/joueurs-search", (req, res) => {
  const nom = String(req.query.nom || "").toLowerCase();

  if (!nom) {
    return res.status(400).json({ error: "nom required" });
  }

  const joueurs = readJoueurs().filter(j =>
    j.nom.toLowerCase().includes(nom)
  );

  res.json(joueurs);
});

// =========================
// Démarrage du serveur
// =========================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});