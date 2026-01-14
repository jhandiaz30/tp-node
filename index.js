const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// =========================
// PATHS DES FICHIERS JSON
// =========================
const equipesPath = path.join(__dirname, "data", "equipes.json");
const joueursPath = path.join(__dirname, "data", "joueurs.json");

// =========================
// MIDDLEWARE
// =========================
app.use(express.json());

// =========================
// HELPERS EQUIPES
// =========================
function readEquipes() {
  const raw = fs.readFileSync(equipesPath, "utf-8");
  if (!raw.trim()) return [];
  return JSON.parse(raw);
}

function writeEquipes(equipes) {
  fs.writeFileSync(equipesPath, JSON.stringify(equipes, null, 2), "utf-8");
}

function nextEquipeId(equipes) {
  return equipes.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0) + 1;
}

// =========================
// HELPERS JOUEURS
// =========================
function readJoueurs() {
  const raw = fs.readFileSync(joueursPath, "utf-8");
  if (!raw.trim()) return [];
  return JSON.parse(raw);
}

function writeJoueurs(joueurs) {
  fs.writeFileSync(joueursPath, JSON.stringify(joueurs, null, 2), "utf-8");
}

function nextJoueurId(joueurs) {
  return joueurs.reduce((m, j) => Math.max(m, Number(j.id) || 0), 0) + 1;
}

// =========================
// ROUTE HOME
// =========================
app.get("/", (req, res) => {
  res.status(200).send("API JSON is running");
});

// =========================
// ROUTES EQUIPES (CRUD)
// =========================

// GET /equipes
app.get("/equipes", (req, res) => {
  res.status(200).json(readEquipes());
});

// GET /equipes/:id
app.get("/equipes/:id", (req, res) => {
  const id = Number(req.params.id);
  const equipe = readEquipes().find((e) => Number(e.id) === id);
  if (!equipe) return res.status(404).json({ error: "Equipe not found" });
  res.status(200).json(equipe);
});

// POST /equipes
app.post("/equipes", (req, res) => {
  const { name, country } = req.body || {};
  if (!name || !country) {
    return res.status(400).json({ error: "name and country required" });
  }

  const equipes = readEquipes();
  const newEquipe = { id: nextEquipeId(equipes), name, country };

  equipes.push(newEquipe);
  writeEquipes(equipes);

  res.status(201).json(newEquipe);
});

// PUT /equipes/:id
app.put("/equipes/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, country } = req.body || {};

  const equipes = readEquipes();
  const idx = equipes.findIndex((e) => Number(e.id) === id);
  if (idx === -1) return res.status(404).json({ error: "Equipe not found" });

  equipes[idx] = {
    ...equipes[idx],
    ...(name !== undefined ? { name } : {}),
    ...(country !== undefined ? { country } : {})
  };

  writeEquipes(equipes);
  res.status(200).json(equipes[idx]);
});

// DELETE /equipes/:id
app.delete("/equipes/:id", (req, res) => {
  const id = Number(req.params.id);
  const equipes = readEquipes();
  const filtered = equipes.filter((e) => Number(e.id) !== id);

  if (filtered.length === equipes.length) {
    return res.status(404).json({ error: "Equipe not found" });
  }

  writeEquipes(filtered);
  res.status(204).send();
});

// =========================
// ROUTES JOUEURS (TP EXERCICE)
// =========================

// 1) CRUD joueurs (4 requêtes)

// GET /joueurs
app.get("/joueurs", (req, res) => {
  res.status(200).json(readJoueurs());
});

// POST /joueurs
app.post("/joueurs", (req, res) => {
  const { idEquipe, nom, numero, poste } = req.body || {};
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

// PUT /joueurs/:id
app.put("/joueurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const { idEquipe, nom, numero, poste } = req.body || {};

  const joueurs = readJoueurs();
  const idx = joueurs.findIndex((j) => Number(j.id) === id);
  if (idx === -1) return res.status(404).json({ error: "Joueur not found" });

  joueurs[idx] = {
    ...joueurs[idx],
    ...(idEquipe !== undefined ? { idEquipe: Number(idEquipe) } : {}),
    ...(nom !== undefined ? { nom } : {}),
    ...(numero !== undefined ? { numero: Number(numero) } : {}),
    ...(poste !== undefined ? { poste } : {})
  };

  writeJoueurs(joueurs);
  res.status(200).json(joueurs[idx]);
});

// DELETE /joueurs/:id
app.delete("/joueurs/:id", (req, res) => {
  const id = Number(req.params.id);
  const joueurs = readJoueurs();
  const filtered = joueurs.filter((j) => Number(j.id) !== id);

  if (filtered.length === joueurs.length) {
    return res.status(404).json({ error: "Joueur not found" });
  }

  writeJoueurs(filtered);
  res.status(204).send();
});

// 2) Joueurs d’une équipe via l’id de l’équipe
// GET /equipes/:id/joueurs
app.get("/equipes/:id/joueurs", (req, res) => {
  const idEquipe = Number(req.params.id);
  const joueurs = readJoueurs().filter((j) => Number(j.idEquipe) === idEquipe);
  res.status(200).json(joueurs);
});

// 3) Afficher l’équipe d’un joueur via l’id du joueur
// GET /joueurs/:id/equipe
app.get("/joueurs/:id/equipe", (req, res) => {
  const idJoueur = Number(req.params.id);
  const joueur = readJoueurs().find((j) => Number(j.id) === idJoueur);
  if (!joueur) return res.status(404).json({ error: "Joueur not found" });

  const equipe = readEquipes().find((e) => Number(e.id) === Number(joueur.idEquipe));
  if (!equipe) return res.status(404).json({ error: "Equipe not found" });

  res.status(200).json(equipe);
});

// 4) Chercher un joueur à partir de son nom
// GET /joueurs-search?nom=...
app.get("/joueurs-search", (req, res) => {
  const nom = String(req.query.nom || "").trim().toLowerCase();
  if (!nom) return res.status(400).json({ error: "query param nom required" });

  const joueurs = readJoueurs().filter((j) =>
    String(j.nom || "").toLowerCase().includes(nom)
  );

  res.status(200).json(joueurs);
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});