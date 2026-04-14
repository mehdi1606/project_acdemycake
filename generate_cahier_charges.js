const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  ExternalHyperlink, TableOfContents
} = require('docx');
const fs = require('fs');

// ── Color palette ──────────────────────────────────────────────────────────────
const MAROON    = "6B1D2A";
const GOLD      = "C5973E";
const GOLD_LIGHT = "F5EBC8";
const CREAM     = "FDF8F0";
const DARK_GRAY = "2D2D2D";
const MID_GRAY  = "5A5A5A";
const LIGHT_GRAY = "F2F2F2";
const WHITE     = "FFFFFF";

// ── Helpers ────────────────────────────────────────────────────────────────────
function hr(color = GOLD, thickness = 8) {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: thickness, color, space: 1 } },
    spacing: { after: 200 },
    children: [],
  });
}

function spacer(after = 200) {
  return new Paragraph({ children: [], spacing: { after } });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 120 },
    children: [new TextRun({ text, bold: true, size: 36, color: WHITE, font: "Arial" })],
    shading: { fill: MAROON, type: ShadingType.CLEAR },
    indent: { left: 200, right: 200 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 20, color: GOLD } },
    indent: { left: 200 },
    children: [new TextRun({ text, bold: true, size: 28, color: MAROON, font: "Arial" })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: DARK_GRAY, font: "Arial" })],
  });
}

function body(text, options = {}) {
  return new Paragraph({
    spacing: { after: 140 },
    children: [new TextRun({ text, size: 22, color: DARK_GRAY, font: "Arial", ...options })],
  });
}

function bodyBold(label, value) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: label + " ", bold: true, size: 22, color: MAROON, font: "Arial" }),
      new TextRun({ text: value, size: 22, color: DARK_GRAY, font: "Arial" }),
    ],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22, color: DARK_GRAY, font: "Arial" })],
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22, color: DARK_GRAY, font: "Arial" })],
  });
}

function twoColRow(label, value, shade = false) {
  const bg = shade ? LIGHT_GRAY : WHITE;
  const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 3600, type: WidthType.DXA },
        shading: { fill: shade ? "EBEBEB" : WHITE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 150, right: 150 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: MAROON, font: "Arial" })] })],
      }),
      new TableCell({
        borders,
        width: { size: 5760, type: WidthType.DXA },
        shading: { fill: bg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 150, right: 150 },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, color: DARK_GRAY, font: "Arial" })] })],
      }),
    ],
  });
}

function infoTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3600, 5760],
    rows: rows.map((r, i) => twoColRow(r[0], r[1], i % 2 === 0)),
  });
}

function headerRow(cols, colWidths) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new TableRow({
    tableHeader: true,
    children: cols.map((col, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: MAROON, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 150, right: 150 },
      children: [new Paragraph({ children: [new TextRun({ text: col, bold: true, size: 20, color: WHITE, font: "Arial" })] })],
    })),
  });
}

function dataRow(cols, colWidths, shade = false) {
  const bg = shade ? LIGHT_GRAY : WHITE;
  const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new TableRow({
    children: cols.map((col, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: bg, type: ShadingType.CLEAR },
      margins: { top: 70, bottom: 70, left: 150, right: 150 },
      children: [new Paragraph({ children: [new TextRun({ text: col, size: 20, color: DARK_GRAY, font: "Arial" })] })],
    })),
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function callout(text, bgColor = GOLD_LIGHT, textColor = MAROON) {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    indent: { left: 300, right: 300 },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 16, color: GOLD } },
    children: [new TextRun({ text, size: 20, color: textColor, italics: true, font: "Arial" })],
  });
}

// ── DOCUMENT ──────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }, {
          level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: DARK_GRAY } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: WHITE },
        paragraph: { spacing: { before: 400, after: 120 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: MAROON },
        paragraph: { spacing: { before: 320, after: 100 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: DARK_GRAY },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [
    // ════════════════════════════════════════════════════════
    // SECTION 1 — Cover Page
    // ════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        spacer(1200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          shading: { fill: MAROON, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "   ", size: 8 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          shading: { fill: MAROON, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "SARALOWE ACADEMY", bold: true, size: 52, color: WHITE, font: "Arial", characterSpacing: 120 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          shading: { fill: MAROON, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "Plateforme de Formation en Ligne", size: 26, color: GOLD_LIGHT, font: "Arial" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          shading: { fill: MAROON, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "   ", size: 8 })],
        }),
        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "CAHIER DES CHARGES", bold: true, size: 56, color: MAROON, font: "Arial", characterSpacing: 60 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 1 } },
          children: [new TextRun({ text: "Spécifications Techniques et Fonctionnelles Complètes", size: 26, color: MID_GRAY, font: "Arial", italics: true })],
        }),
        spacer(400),
        new Table({
          width: { size: 5760, type: WidthType.DXA },
          columnWidths: [2400, 3360],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 2400, type: WidthType.DXA }, shading: { fill: MAROON, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Référence :", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 3360, type: WidthType.DXA }, shading: { fill: GOLD_LIGHT, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, children: [new Paragraph({ children: [new TextRun({ text: "SAR-CDC-2025-001", size: 20, color: DARK_GRAY, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 2400, type: WidthType.DXA }, shading: { fill: MAROON, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Version :", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 3360, type: WidthType.DXA }, shading: { fill: GOLD_LIGHT, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, children: [new Paragraph({ children: [new TextRun({ text: "1.0", size: 20, color: DARK_GRAY, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 2400, type: WidthType.DXA }, shading: { fill: MAROON, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Date :", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 3360, type: WidthType.DXA }, shading: { fill: GOLD_LIGHT, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, children: [new Paragraph({ children: [new TextRun({ text: "Avril 2025", size: 20, color: DARK_GRAY, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 2400, type: WidthType.DXA }, shading: { fill: MAROON, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Statut :", bold: true, size: 20, color: WHITE, font: "Arial" })] })] }),
              new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 3360, type: WidthType.DXA }, shading: { fill: GOLD_LIGHT, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, children: [new Paragraph({ children: [new TextRun({ text: "Final", size: 20, color: DARK_GRAY, font: "Arial" })] })] }),
            ]}),
          ],
        }),
        spacer(600),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          shading: { fill: GOLD, type: ShadingType.CLEAR },
          children: [new TextRun({ text: "   ", size: 6 })],
        }),
        pageBreak(),

        // ── TABLE OF CONTENTS ──
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 300 },
          children: [new TextRun({ text: "TABLE DES MATIERES", bold: true, size: 32, color: MAROON, font: "Arial", characterSpacing: 80 })],
        }),
        hr(GOLD, 6),
        new TableOfContents("Table des Matières", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 1 — PRESENTATION GENERALE
        // ════════════════════════════════════════════════════════
        h1("1. PRÉSENTATION GÉNÉRALE DU PROJET"),
        spacer(80),

        h2("1.1 Contexte et Objectif"),
        body("Saralowe Academy est une plateforme de formation en ligne (LMS — Learning Management System) de type premium, conçue pour offrir des cours de qualité supérieure dans un environnement élégant et sécurisé. La plateforme cible principalement les formations dans des domaines artistiques et créatifs, avec une identité visuelle distinctive basée sur une palette marron-bordeaux et dorée."),
        spacer(100),
        body("L'objectif principal est de créer un écosystème complet d'apprentissage en ligne permettant :"),
        bullet("Aux formateurs (instructeurs) de créer, gérer et monétiser leurs cours"),
        bullet("Aux apprenants (étudiants) de s'inscrire, suivre leur progression et obtenir des certificats"),
        bullet("Aux administrateurs de superviser l'ensemble de la plateforme"),
        spacer(160),

        h2("1.2 Identité de la Plateforme"),
        infoTable([
          ["Nom de la plateforme", "Saralowe Academy"],
          ["Domaine", "saralowe.academy"],
          ["Type", "Learning Management System (LMS) Premium"],
          ["Langue principale", "Français / Arabe / Anglais (multilingue)"],
          ["Devise", "Dirham Marocain (MAD)"],
          ["Public cible", "Étudiants adultes, professionnels en reconversion"],
          ["Secteur", "Formation créative et artistique en ligne"],
        ]),
        spacer(200),

        h2("1.3 Charte Graphique"),
        infoTable([
          ["Couleur primaire", "Marron foncé — #6B1D2A (bordeaux luxe)"],
          ["Couleur accent", "Or — #C5973E"],
          ["Couleur secondaire", "Crème — #FDF8F0"],
          ["Typographie", "Arial / Helvetica (documents), Polices système web"],
          ["Style visuel", "Luxe moderne, minimaliste, premium"],
        ]),
        spacer(200),

        h2("1.4 Portée du Projet"),
        body("Le projet comprend deux composantes principales :"),
        numbered("Backend API REST — Application Spring Boot exposant l'ensemble des services métier"),
        numbered("Frontend SPA — Application React consommant l'API et offrant l'interface utilisateur"),
        spacer(100),
        callout("Ce document constitue la spécification technique et fonctionnelle complète de la plateforme Saralowe Academy, servant de référence pour le développement, les tests et la maintenance."),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 2 — ARCHITECTURE TECHNIQUE
        // ════════════════════════════════════════════════════════
        h1("2. ARCHITECTURE TECHNIQUE"),
        spacer(80),

        h2("2.1 Vue d'ensemble de l'Architecture"),
        body("La plateforme suit une architecture client-serveur découplée (Headless Architecture) avec :"),
        bullet("Un backend RESTful construit avec Spring Boot 3"),
        bullet("Un frontend Single Page Application (SPA) en React 19"),
        bullet("Une base de données relationnelle PostgreSQL"),
        bullet("Des services tiers pour la vidéo, le paiement et le stockage"),
        spacer(160),

        h2("2.2 Stack Technologique Backend"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 2400, 4160],
          rows: [
            headerRow(["Technologie", "Version", "Rôle"], [2800, 2400, 4160]),
            dataRow(["Java", "17 (LTS)", "Langage de programmation principal"], [2800, 2400, 4160], false),
            dataRow(["Spring Boot", "3.2.3", "Framework applicatif principal"], [2800, 2400, 4160], true),
            dataRow(["Spring Security", "6.x", "Authentification et autorisation JWT"], [2800, 2400, 4160], false),
            dataRow(["Spring Data JPA", "3.x", "ORM et accès base de données"], [2800, 2400, 4160], true),
            dataRow(["Spring WebSocket", "6.x", "Messagerie temps réel (STOMP/SockJS)"], [2800, 2400, 4160], false),
            dataRow(["PostgreSQL", "15+", "Base de données relationnelle principale"], [2800, 2400, 4160], true),
            dataRow(["Flyway", "9.x", "Migration et versioning du schéma DB"], [2800, 2400, 4160], false),
            dataRow(["Redis", "7.x", "Cache distribué et gestion des sessions"], [2800, 2400, 4160], true),
            dataRow(["Caffeine Cache", "3.x", "Cache applicatif en mémoire"], [2800, 2400, 4160], false),
            dataRow(["Bucket4j", "8.x", "Rate limiting et protection anti-abus"], [2800, 2400, 4160], true),
            dataRow(["iText 7", "7.2.5", "Génération de certificats PDF"], [2800, 2400, 4160], false),
            dataRow(["Lombok", "1.18.x", "Réduction du code boilerplate Java"], [2800, 2400, 4160], true),
            dataRow(["MapStruct", "1.5.x", "Mapping DTO/Entité automatique"], [2800, 2400, 4160], false),
            dataRow(["OpenAPI / Swagger", "2.x", "Documentation automatique de l'API"], [2800, 2400, 4160], true),
          ],
        }),
        spacer(200),

        h2("2.3 Stack Technologique Frontend"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 2400, 4160],
          rows: [
            headerRow(["Technologie", "Version", "Rôle"], [2800, 2400, 4160]),
            dataRow(["React", "19.x", "Bibliothèque UI principale"], [2800, 2400, 4160], false),
            dataRow(["TypeScript", "5.x", "Typage statique JavaScript"], [2800, 2400, 4160], true),
            dataRow(["Redux Toolkit", "2.x", "Gestion d'état globale"], [2800, 2400, 4160], false),
            dataRow(["React Router", "6.x", "Navigation et routage SPA"], [2800, 2400, 4160], true),
            dataRow(["Axios", "1.x", "Client HTTP pour appels API"], [2800, 2400, 4160], false),
            dataRow(["Vite", "5.x", "Build tool et serveur de développement"], [2800, 2400, 4160], true),
            dataRow(["STOMP.js / SockJS", "6.x / 1.x", "Client WebSocket pour messagerie"], [2800, 2400, 4160], false),
            dataRow(["React Hook Form", "7.x", "Gestion des formulaires"], [2800, 2400, 4160], true),
            dataRow(["Zod", "3.x", "Validation des schémas de données"], [2800, 2400, 4160], false),
            dataRow(["Chart.js / Recharts", "4.x", "Visualisations et graphiques"], [2800, 2400, 4160], true),
          ],
        }),
        spacer(200),

        h2("2.4 Services Tiers"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 6960],
          rows: [
            headerRow(["Service", "Description et Utilisation"], [2400, 6960]),
            dataRow(["MUX", "Hébergement et streaming vidéo professionnel. Upload direct depuis le navigateur ou via serveur. Transcoding automatique, thumbnails, sous-titres."], [2400, 6960], false),
            dataRow(["PayZone", "Passerelle de paiement supportant la monnaie MAD (Dirham marocain). Traitement des transactions d'inscription aux cours."], [2400, 6960], true),
            dataRow(["Cloudinary / AWS S3", "Stockage des images : thumbnails de cours, photos de profil, documents."], [2400, 6960], false),
            dataRow(["SMTP / JavaMail", "Envoi d'emails transactionnels : vérification de compte, réinitialisation mot de passe, notifications."], [2400, 6960], true),
          ],
        }),
        spacer(200),

        h2("2.5 Architecture de Déploiement"),
        body("L'application est conçue pour un déploiement cloud-ready avec les caractéristiques suivantes :"),
        bullet("Conteneurisation Docker pour une portabilité maximale"),
        bullet("Séparation des environnements : développement, staging, production"),
        bullet("Variables d'environnement externalisées (application.properties / .env)"),
        bullet("Base de données managée (ex. AWS RDS, DigitalOcean Managed DB)"),
        bullet("CDN pour les assets statiques frontend (ex. Cloudflare, AWS CloudFront)"),
        bullet("Load balancer avec SSL/TLS termination"),
        spacer(160),
        callout("L'architecture microservices est envisagée pour une phase ultérieure. La version actuelle suit une architecture monolithique modulaire, plus adaptée au stade initial du projet."),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 3 — MODELE DE DONNEES
        // ════════════════════════════════════════════════════════
        h1("3. MODÈLE DE DONNÉES"),
        spacer(80),

        h2("3.1 Entités Principales"),
        body("Le schéma de base de données comprend les entités suivantes, gérées via Flyway pour les migrations versionnées :"),
        spacer(120),

        h3("3.1.1 User (Utilisateur)"),
        infoTable([
          ["Table", "users"],
          ["Clé primaire", "UUID (id)"],
          ["Champs principaux", "email, password, firstName, lastName, role, isActive, isEmailVerified"],
          ["Relations", "OneToMany: enrollments, courses (instructor), posts, messages, certificates"],
          ["Rôles", "STUDENT, INSTRUCTOR, ADMIN"],
          ["Sécurité", "Mot de passe haché avec BCrypt (strength 12)"],
        ]),
        spacer(160),

        h3("3.1.2 Course (Cours)"),
        infoTable([
          ["Table", "courses"],
          ["Clé primaire", "UUID (id)"],
          ["Champs principaux", "title, description, shortDescription, price, level, status, thumbnailUrl, language"],
          ["Statuts", "DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED"],
          ["Relations", "ManyToOne: instructor (User), Category | OneToMany: modules, enrollments, ratings"],
          ["Contraintes", "Seul l'instructeur propriétaire peut modifier un cours"],
        ]),
        spacer(160),

        h3("3.1.3 Module & Lesson (Module et Leçon)"),
        infoTable([
          ["Tables", "modules, lessons"],
          ["Module — champs", "title, description, orderIndex, courseId"],
          ["Lesson — champs", "title, description, orderIndex, lessonType, videoUrl, muxAssetId, muxPlaybackId, duration, isFree"],
          ["Types de leçon", "VIDEO, TEXT, QUIZ"],
          ["Relations", "Module ManyToOne Course | Lesson ManyToOne Module"],
        ]),
        spacer(160),

        h3("3.1.4 Quiz & Questions"),
        infoTable([
          ["Tables", "quizzes, quiz_questions, quiz_options, quiz_attempts, quiz_answers"],
          ["Quiz — champs", "lessonId, timeLimit, passingScore, maxAttempts, shuffleQuestions"],
          ["QuizQuestion — champs", "questionText, explanation, points, orderIndex, type (SINGLE/MULTIPLE)"],
          ["QuizOption — champs", "optionText, isCorrect, orderIndex"],
          ["QuizAttempt — champs", "userId, score, passed, startedAt, completedAt, violated"],
          ["Anti-triche", "Champ 'violated' = true si changement d'onglet/fenêtre détecté"],
        ]),
        spacer(160),

        h3("3.1.5 Enrollment (Inscription)"),
        infoTable([
          ["Table", "course_enrollments"],
          ["Champs principaux", "userId, courseId, progressPercentage, completedLessons, totalLessons, isCompleted, enrolledAt"],
          ["Relations", "OneToMany: lessonProgresses"],
          ["Note", "progressPercentage calculée dynamiquement depuis LessonProgress (jamais stale)"],
        ]),
        spacer(160),

        h3("3.1.6 LessonProgress (Progression par Leçon)"),
        infoTable([
          ["Table", "lesson_progress"],
          ["Champs principaux", "userId, lessonId, isCompleted, completedAt, watchedSeconds, watchedPercentage"],
          ["Contrainte", "UNIQUE(userId, lessonId) — une seule entrée par leçon par étudiant"],
          ["Usage", "Source de vérité pour le calcul de la progression d'un cours"],
        ]),
        spacer(160),

        h3("3.1.7 Certificate (Certificat)"),
        infoTable([
          ["Table", "certificates"],
          ["Champs principaux", "userId, courseId, certificateNumber, studentName, courseTitle, instructorName, completionDate, issuedAt"],
          ["Génération", "Automatique à la complétion du cours (100% des leçons terminées)"],
          ["Format", "PDF généré dynamiquement avec iText 7 (design luxe marron/or)"],
          ["Unicité", "UNIQUE(userId, courseId) — un seul certificat par étudiant par cours"],
          ["Numérotation", "Format : CDA-{timestamp6}-{UUID8} (ex: CDA-892341-A7F2B3E9)"],
        ]),
        spacer(160),

        h3("3.1.8 Payment & Earning (Paiement et Revenu)"),
        infoTable([
          ["Tables", "payments, earnings, payouts"],
          ["Payment — champs", "userId, courseId, amount, currency(MAD), status, paymentMethod, transactionId"],
          ["Earning — champs", "instructorId, courseId, paymentId, amount, platformFee, netAmount, status"],
          ["Payout — champs", "instructorId, amount, status, requestedAt, processedAt, method"],
          ["Distribution", "Revenus automatiquement créditeurs après validation du paiement"],
        ]),
        spacer(160),

        h3("3.1.9 Community (Communauté)"),
        infoTable([
          ["Tables", "posts, comments, likes"],
          ["Post — champs", "authorId, courseId, title, content, postType, attachmentUrl, pinned"],
          ["Types de post", "DISCUSSION, QUESTION, ANNOUNCEMENT, RESOURCE"],
          ["Relations", "Post OneToMany Comments | Post/Comment ManyToMany Likes"],
        ]),
        spacer(160),

        h3("3.1.10 Messaging (Messagerie)"),
        infoTable([
          ["Tables", "conversations, messages"],
          ["Conversation — champs", "participants (ManyToMany), lastMessage, lastMessageAt, unreadCountMap"],
          ["Message — champs", "conversationId, senderId, content, type, isRead, sentAt"],
          ["Transport", "WebSocket STOMP via SockJS pour la messagerie temps réel"],
        ]),
        spacer(160),

        h3("3.1.11 Notification"),
        infoTable([
          ["Table", "notifications"],
          ["Champs principaux", "userId, type, title, message, isRead, relatedEntityId, relatedEntityType, createdAt"],
          ["Types", "ENROLLMENT, COURSE_PUBLISHED, NEW_MESSAGE, CERTIFICATE, PAYOUT, QUIZ_PASSED, ANNOUNCEMENT"],
          ["Diffusion", "WebSocket pour les notifications temps réel + stockage DB pour l'historique"],
        ]),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 4 — FONCTIONNALITES PAR ROLE
        // ════════════════════════════════════════════════════════
        h1("4. FONCTIONNALITÉS PAR RÔLE"),
        spacer(80),

        h2("4.1 Rôle ÉTUDIANT (STUDENT)"),
        spacer(80),

        h3("4.1.1 Authentification et Profil"),
        bullet("Inscription avec email/mot de passe + vérification par email"),
        bullet("Connexion avec tokens JWT (access 15 min + refresh 7 jours)"),
        bullet("Réinitialisation de mot de passe par email"),
        bullet("Modification du profil : nom, bio, photo, mot de passe"),
        bullet("Déconnexion avec invalidation du refresh token"),
        spacer(120),

        h3("4.1.2 Catalogue et Recherche"),
        bullet("Navigation du catalogue de cours avec filtres multiples :"),
        bullet("Catégorie, niveau (BEGINNER/INTERMEDIATE/ADVANCED)", 1),
        bullet("Fourchette de prix, durée, langue", 1),
        bullet("Note moyenne, popularité", 1),
        bullet("Recherche full-text sur titre, description, instructeur"),
        bullet("Vue détaillée d'un cours : curriculum, bio instructeur, avis, prérequis"),
        bullet("Cours gratuits accessibles sans inscription"),
        spacer(120),

        h3("4.1.3 Inscription et Paiement"),
        bullet("Inscription gratuite (pour cours gratuits)"),
        bullet("Paiement sécurisé via PayZone (MAD)"),
        bullet("Accès immédiat après validation du paiement"),
        bullet("Historique des paiements consultable"),
        spacer(120),

        h3("4.1.4 Suivi de Cours (Course Watch)"),
        bullet("Lecteur vidéo intégré (MUX Player) avec contrôles standards"),
        bullet("Navigation entre les leçons via barre latérale"),
        bullet("Marquage automatique d'une leçon comme complétée (après visionnage)"),
        bullet("Progression persistée en base de données (survit aux rafraîchissements)"),
        bullet("Quiz intégré directement dans la page de cours (overlay plein écran) :"),
        bullet("Pas de navigation vers une autre page", 1),
        bullet("Minuteur en temps réel avec compte à rebours", 1),
        bullet("Feedback immédiat question par question (Check/Retry/Next)", 1),
        bullet("Détection anti-triche : changement d'onglet = soumission automatique", 1),
        bullet("Score, taux de réussite, barre de progression en résultat", 1),
        bullet("Continuation automatique après quiz réussi (leçon marquée complétée)", 1),
        spacer(120),

        h3("4.1.5 Progression et Tableau de Bord"),
        bullet("Tableau de bord étudiant avec statistiques globales"),
        bullet("Nombre total de cours inscrits, complétés, en cours"),
        bullet("Heure totale de formation"),
        bullet("Pourcentage de progression en temps réel par cours"),
        bullet("Widget 'Continuer à regarder' (dernier cours consulté)"),
        spacer(120),

        h3("4.1.6 Certificats"),
        bullet("Génération automatique à la complétion du cours (100% des leçons)"),
        bullet("Certificat unique numéroté (format CDA-XXXXXX-XXXXXXXX)"),
        bullet("Design luxe PDF : fond crème, bandeau marron, accents dorés"),
        bullet("Informations incluses : nom étudiant, cours, instructeur, date de complétion"),
        bullet("Téléchargement PDF depuis l'espace étudiant"),
        bullet("URL de vérification publique : /verify/{certificateNumber}"),
        spacer(120),

        h3("4.1.7 Communauté"),
        bullet("Consultation des discussions, questions et annonces d'un cours"),
        bullet("Création de posts (DISCUSSION, QUESTION)"),
        bullet("Commentaires sur les posts"),
        bullet("Likes sur posts et commentaires"),
        spacer(120),

        h3("4.1.8 Messagerie"),
        bullet("Messagerie privée en temps réel avec les instructeurs"),
        bullet("Conversations WebSocket (STOMP/SockJS)"),
        bullet("Indicateurs de messages non lus"),
        bullet("Historique des conversations persisté"),
        spacer(200),

        h2("4.2 Rôle INSTRUCTEUR (INSTRUCTOR)"),
        spacer(80),

        h3("4.2.1 Gestion des Cours"),
        bullet("Création de cours avec : titre, description, niveau, prix, catégorie, langue"),
        bullet("Upload de thumbnail du cours"),
        bullet("Gestion des modules : création, modification, suppression, réorganisation"),
        bullet("Gestion des leçons : création, modification, suppression"),
        bullet("Upload de vidéos via MUX (direct upload ou server-side)"),
        bullet("Création de quiz attachés à une leçon"),
        bullet("Soumission du cours pour révision (statut PENDING_REVIEW)"),
        spacer(120),

        h3("4.2.2 Gestion des Étudiants"),
        bullet("Liste paginée des étudiants inscrits (tous cours confondus)"),
        bullet("Recherche par nom ou email"),
        bullet("Profil détaillé d'un étudiant : progression par cours, quiz passés"),
        bullet("Liste des étudiants par cours spécifique"),
        spacer(120),

        h3("4.2.3 Revenus et Paiements"),
        bullet("Tableau récapitulatif des revenus : total, mois en cours, 12 derniers mois"),
        bullet("Graphique d'évolution mensuelle des revenus"),
        bullet("Liste paginée de chaque transaction de revenu"),
        bullet("Historique des demandes de virement"),
        bullet("Demande de virement (payout) avec montant personnalisé"),
        spacer(120),

        h3("4.2.4 Annonces et Communauté"),
        bullet("Création d'annonces (PostType.ANNOUNCEMENT) pour ses cours"),
        bullet("Modification et suppression de ses annonces"),
        bullet("Consultation des discussions des étudiants"),
        spacer(120),

        h3("4.2.5 Certificats Instructeur"),
        bullet("Vue de tous les certificats émis pour ses cours"),
        bullet("Téléchargement de tout certificat appartenant à ses cours"),
        bullet("Génération entièrement automatique — aucune action requise"),
        spacer(200),

        h2("4.3 Rôle ADMINISTRATEUR (ADMIN)"),
        spacer(80),

        h3("4.3.1 Gestion des Utilisateurs"),
        bullet("Liste complète des utilisateurs avec recherche et filtres"),
        bullet("Activation/désactivation de comptes"),
        bullet("Modification du rôle d'un utilisateur"),
        bullet("Suppression de compte"),
        bullet("Vue détaillée : inscriptions, activité, paiements"),
        spacer(120),

        h3("4.3.2 Gestion des Cours"),
        bullet("Liste de tous les cours (tous statuts confondus)"),
        bullet("Validation et publication des cours en attente (PENDING_REVIEW)"),
        bullet("Rejet avec commentaire motivé"),
        bullet("Archivage de cours obsolètes"),
        bullet("Suppression forcée"),
        spacer(120),

        h3("4.3.3 Gestion des Catégories"),
        bullet("Création, modification, suppression des catégories de cours"),
        bullet("Réorganisation de l'arborescence des catégories"),
        spacer(120),

        h3("4.3.4 Finance et Paiements"),
        bullet("Vue globale de toutes les transactions"),
        bullet("Validation et traitement des demandes de payout"),
        bullet("Statistiques de revenu global de la plateforme"),
        bullet("Taux de commission configurable"),
        spacer(120),

        h3("4.3.5 Tableau de Bord Analytics"),
        bullet("KPIs globaux : total utilisateurs, cours, revenus, inscriptions"),
        bullet("Graphiques d'évolution : nouveaux inscrits, revenus, cours publiés"),
        bullet("Top 5 des cours les plus populaires"),
        bullet("Répartition par catégorie"),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 5 — API REST
        // ════════════════════════════════════════════════════════
        h1("5. SPÉCIFICATION DE L'API REST"),
        spacer(80),

        h2("5.1 Conventions Générales"),
        infoTable([
          ["Base URL", "/api/v1"],
          ["Format", "JSON (Content-Type: application/json)"],
          ["Authentification", "Bearer Token (JWT) dans l'en-tête Authorization"],
          ["Versioning", "Par URL (/v1, /v2, ...)"],
          ["Pagination", "Paramètres : page (défaut 0), size (défaut 10/20)"],
          ["Format réponse", "{ success, message, data, timestamp }"],
          ["Format liste", "{ content[], page, size, totalElements, totalPages }"],
          ["Erreurs", "{ success: false, message, errors[], timestamp }"],
        ]),
        spacer(200),

        h2("5.2 Endpoints d'Authentification (/api/v1/auth)"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1400, 3200, 1600, 3160],
          rows: [
            headerRow(["Méthode", "URL", "Auth", "Description"], [1400, 3200, 1600, 3160]),
            dataRow(["POST", "/auth/register", "Aucune", "Inscription nouveau utilisateur"], [1400, 3200, 1600, 3160], false),
            dataRow(["POST", "/auth/login", "Aucune", "Connexion (retourne access + refresh token)"], [1400, 3200, 1600, 3160], true),
            dataRow(["POST", "/auth/refresh", "Aucune", "Renouveler l'access token"], [1400, 3200, 1600, 3160], false),
            dataRow(["POST", "/auth/logout", "JWT", "Déconnexion + invalidation refresh token"], [1400, 3200, 1600, 3160], true),
            dataRow(["GET", "/auth/verify-email", "Aucune", "Vérification email (token par URL)"], [1400, 3200, 1600, 3160], false),
            dataRow(["POST", "/auth/forgot-password", "Aucune", "Demande de réinitialisation mot de passe"], [1400, 3200, 1600, 3160], true),
            dataRow(["POST", "/auth/reset-password", "Aucune", "Réinitialisation avec token reçu par mail"], [1400, 3200, 1600, 3160], false),
            dataRow(["POST", "/auth/resend-verification", "Aucune", "Renvoi de l'email de vérification"], [1400, 3200, 1600, 3160], true),
          ],
        }),
        spacer(200),

        h2("5.3 Endpoints Publics (/api/v1)"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1400, 3600, 4360],
          rows: [
            headerRow(["Méthode", "URL", "Description"], [1400, 3600, 4360]),
            dataRow(["GET", "/courses", "Liste publique des cours (filtrés, paginés)"], [1400, 3600, 4360], false),
            dataRow(["GET", "/courses/{id}", "Détail public d'un cours"], [1400, 3600, 4360], true),
            dataRow(["GET", "/courses/{id}/curriculum", "Curriculum complet (modules + leçons)"], [1400, 3600, 4360], false),
            dataRow(["GET", "/courses/{id}/reviews", "Avis sur un cours"], [1400, 3600, 4360], true),
            dataRow(["GET", "/categories", "Liste des catégories"], [1400, 3600, 4360], false),
            dataRow(["GET", "/instructors/{id}", "Profil public d'un instructeur"], [1400, 3600, 4360], true),
            dataRow(["GET", "/certificates/verify/{num}", "Vérification publique d'un certificat"], [1400, 3600, 4360], false),
          ],
        }),
        spacer(200),

        h2("5.4 Endpoints Étudiant (/api/v1/student)"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1400, 4200, 3760],
          rows: [
            headerRow(["Méthode", "URL", "Description"], [1400, 4200, 3760]),
            dataRow(["GET", "/student/dashboard", "Tableau de bord étudiant"], [1400, 4200, 3760], false),
            dataRow(["GET", "/student/enrollments", "Mes inscriptions avec progression live"], [1400, 4200, 3760], true),
            dataRow(["POST", "/student/enrollments", "S'inscrire à un cours"], [1400, 4200, 3760], false),
            dataRow(["GET", "/student/enrollments/{id}", "Détail d'une inscription"], [1400, 4200, 3760], true),
            dataRow(["GET", "/courses/{id}/my-progress", "IDs des leçons complétées (cours actif)"], [1400, 4200, 3760], false),
            dataRow(["POST", "/courses/{id}/lessons/{lid}/complete", "Marquer une leçon comme complétée"], [1400, 4200, 3760], true),
            dataRow(["GET", "/student/certificates", "Mes certificats gagnés"], [1400, 4200, 3760], false),
            dataRow(["GET", "/student/certificates/{id}/download", "Télécharger un certificat PDF"], [1400, 4200, 3760], true),
            dataRow(["GET", "/student/payments", "Historique de mes paiements"], [1400, 4200, 3760], false),
            dataRow(["POST", "/payments/initiate", "Initier un paiement PayZone"], [1400, 4200, 3760], true),
            dataRow(["GET", "/quizzes/{lessonId}", "Récupérer le quiz d'une leçon"], [1400, 4200, 3760], false),
            dataRow(["POST", "/quizzes/{id}/attempt", "Démarrer une tentative de quiz"], [1400, 4200, 3760], true),
            dataRow(["POST", "/quizzes/attempts/{id}/submit", "Soumettre les réponses du quiz"], [1400, 4200, 3760], false),
          ],
        }),
        spacer(200),

        h2("5.5 Endpoints Instructeur (/api/v1/instructor)"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1400, 4600, 3360],
          rows: [
            headerRow(["Méthode", "URL", "Description"], [1400, 4600, 3360]),
            dataRow(["GET", "/instructor/dashboard", "Tableau de bord instructeur"], [1400, 4600, 3360], false),
            dataRow(["GET", "/instructor/courses", "Mes cours (paginés)"], [1400, 4600, 3360], true),
            dataRow(["POST", "/instructor/courses", "Créer un cours"], [1400, 4600, 3360], false),
            dataRow(["PUT", "/instructor/courses/{id}", "Modifier un cours"], [1400, 4600, 3360], true),
            dataRow(["DELETE", "/instructor/courses/{id}", "Supprimer un cours"], [1400, 4600, 3360], false),
            dataRow(["POST", "/instructor/courses/{id}/publish", "Soumettre pour révision"], [1400, 4600, 3360], true),
            dataRow(["POST", "/instructor/courses/{id}/thumbnail", "Upload thumbnail du cours"], [1400, 4600, 3360], false),
            dataRow(["POST/PUT/DELETE", "/instructor/courses/{id}/modules/*", "CRUD modules et réorganisation"], [1400, 4600, 3360], true),
            dataRow(["POST/PUT/DELETE", "/instructor/modules/{id}/lessons/*", "CRUD leçons"], [1400, 4600, 3360], false),
            dataRow(["POST", "/instructor/lessons/{id}/upload-video", "Obtenir URL upload vidéo MUX"], [1400, 4600, 3360], true),
            dataRow(["GET", "/instructor/students", "Liste de mes étudiants (recherche)"], [1400, 4600, 3360], false),
            dataRow(["GET", "/instructor/earnings/summary", "Résumé des revenus 12 mois"], [1400, 4600, 3360], true),
            dataRow(["GET", "/instructor/earnings", "Liste paginée des revenus"], [1400, 4600, 3360], false),
            dataRow(["POST", "/instructor/payouts/request", "Demander un virement"], [1400, 4600, 3360], true),
            dataRow(["GET", "/instructor/certificates", "Certificats de mes cours"], [1400, 4600, 3360], false),
          ],
        }),
        spacer(200),

        h2("5.6 Endpoints Administrateur (/api/v1/admin)"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1400, 4200, 3760],
          rows: [
            headerRow(["Méthode", "URL", "Description"], [1400, 4200, 3760]),
            dataRow(["GET", "/admin/dashboard", "Tableau de bord administrateur"], [1400, 4200, 3760], false),
            dataRow(["GET/PUT/DELETE", "/admin/users/*", "Gestion complète des utilisateurs"], [1400, 4200, 3760], true),
            dataRow(["GET", "/admin/courses", "Tous les cours (tous statuts)"], [1400, 4200, 3760], false),
            dataRow(["POST", "/admin/courses/{id}/approve", "Approuver et publier un cours"], [1400, 4200, 3760], true),
            dataRow(["POST", "/admin/courses/{id}/reject", "Rejeter un cours avec commentaire"], [1400, 4200, 3760], false),
            dataRow(["POST/PUT/DELETE", "/admin/categories/*", "Gestion des catégories"], [1400, 4200, 3760], true),
            dataRow(["GET", "/admin/payments", "Toutes les transactions"], [1400, 4200, 3760], false),
            dataRow(["POST", "/admin/payouts/{id}/approve", "Valider un payout"], [1400, 4200, 3760], true),
            dataRow(["POST", "/admin/payouts/{id}/reject", "Rejeter un payout"], [1400, 4200, 3760], false),
          ],
        }),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 6 — SECURITE
        // ════════════════════════════════════════════════════════
        h1("6. SÉCURITÉ"),
        spacer(80),

        h2("6.1 Authentification JWT"),
        body("La plateforme implémente une authentification sans état (stateless) basée sur JSON Web Tokens (JWT) :"),
        spacer(80),
        infoTable([
          ["Access Token", "Durée de vie : 15 minutes | Signé avec algorithme HS256"],
          ["Refresh Token", "Durée de vie : 7 jours | Stocké en base de données"],
          ["Rotation", "Le refresh token est renouvelé à chaque usage (rotation)"],
          ["Invalidation", "Logout invalide le refresh token en base (blacklisting sélectif)"],
          ["Transmission", "Access token via en-tête Authorization: Bearer {token}"],
          ["Hachage", "Mots de passe hachés BCrypt avec salt aléatoire (strength 12)"],
        ]),
        spacer(200),

        h2("6.2 Autorisation Role-Based (RBAC)"),
        body("Chaque endpoint est protégé par des annotations @PreAuthorize :"),
        bullet("@PreAuthorize(\"hasRole('STUDENT')\") — accès étudiant uniquement"),
        bullet("@PreAuthorize(\"hasAnyRole('INSTRUCTOR', 'ADMIN')\") — instructeur ou admin"),
        bullet("@PreAuthorize(\"hasRole('ADMIN')\") — accès administrateur uniquement"),
        bullet("Les instructeurs ne peuvent modifier que leurs propres cours (vérification userId)"),
        bullet("Les étudiants ne peuvent accéder qu'à leurs propres données (certificats, progression)"),
        spacer(200),

        h2("6.3 Protection Anti-Abus"),
        infoTable([
          ["Rate Limiting", "Bucket4j : limite le nombre de requêtes par IP et par utilisateur"],
          ["Anti-brute force", "Limite sur /auth/login (ex. 5 tentatives / minute / IP)"],
          ["CORS", "Cross-Origin configuré pour les domaines autorisés uniquement"],
          ["CSRF", "Désactivé (API REST stateless, JWT dans en-tête)"],
          ["XSS", "Validation des entrées + Spring Security headers"],
          ["SQL Injection", "JPA/Hibernate avec requêtes paramétrées (aucune concaténation SQL)"],
          ["Input validation", "Bean Validation (@Valid, @NotNull, @Size, @Email) sur tous les DTOs"],
        ]),
        spacer(200),

        h2("6.4 Anti-Triche Quiz"),
        body("Un mécanisme de détection de triche est implémenté pendant les quiz :"),
        bullet("Événement 'visibilitychange' surveille si l'étudiant change d'onglet ou fenêtre"),
        bullet("Lors d'un changement d'onglet détecté : soumission automatique du quiz"),
        bullet("Le champ 'violated' = true est enregistré en base de données"),
        bullet("Les tentatives avec violation sont clairement identifiées dans les résultats"),
        bullet("Score de 0 attribué pour les soumissions forcées par violation"),
        spacer(200),

        h2("6.5 Vérification Email"),
        bullet("Lien de vérification envoyé par email lors de l'inscription"),
        bullet("Token unique à usage unique avec expiration (24h)"),
        bullet("Compte inaccessible avant vérification de l'email"),
        bullet("Possibilité de renvoi du mail de vérification"),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 7 — INTERFACE UTILISATEUR
        // ════════════════════════════════════════════════════════
        h1("7. INTERFACE UTILISATEUR (FRONTEND)"),
        spacer(80),

        h2("7.1 Structure de l'Application React"),
        body("L'application frontend est une Single Page Application (SPA) organisée par fonctionnalité :"),
        spacer(80),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3200, 6160],
          rows: [
            headerRow(["Module / Dossier", "Contenu"], [3200, 6160]),
            dataRow(["feature-module/auth", "Pages login, register, forgot-password, verify-email"], [3200, 6160], false),
            dataRow(["feature-module/home", "Page d'accueil publique, landing page"], [3200, 6160], true),
            dataRow(["feature-module/Courses", "Catalogue, détail cours, lecteur vidéo (courseWatch)"], [3200, 6160], false),
            dataRow(["feature-module/student", "Dashboard, mes cours, certificats, profil"], [3200, 6160], true),
            dataRow(["feature-module/Instructor", "Dashboard, gestion cours, étudiants, revenus, certificats"], [3200, 6160], false),
            dataRow(["feature-module/admin", "Dashboard admin, gestion users/cours/paiements"], [3200, 6160], true),
            dataRow(["feature-module/community", "Discussions, posts, commentaires"], [3200, 6160], false),
            dataRow(["feature-module/messages", "Messagerie temps réel"], [3200, 6160], true),
            dataRow(["services/api", "Services TypeScript : auth, course, certificate, quiz, payment..."], [3200, 6160], false),
            dataRow(["store/", "Redux slices : auth, enrollment, notification, ui"], [3200, 6160], true),
            dataRow(["components/", "Composants réutilisables : Header, Sidebar, Modal, Table..."], [3200, 6160], false),
          ],
        }),
        spacer(200),

        h2("7.2 Pages Principales"),
        spacer(80),

        h3("7.2.1 Pages Publiques"),
        bullet("/ — Page d'accueil avec hero section, cours en vedette, témoignages"),
        bullet("/courses — Catalogue avec filtres avancés"),
        bullet("/courses/{id} — Page détail cours (curriculum, instructeur, avis)"),
        bullet("/verify/{certificateNumber} — Vérification publique de certificat"),
        bullet("/instructors/{id} — Profil public instructeur"),
        spacer(120),

        h3("7.2.2 Pages Authentification"),
        bullet("/auth/login — Formulaire de connexion"),
        bullet("/auth/register — Formulaire d'inscription"),
        bullet("/auth/forgot-password — Demande réinitialisation"),
        bullet("/auth/reset-password — Nouveau mot de passe"),
        spacer(120),

        h3("7.2.3 Espace Étudiant"),
        bullet("/student/dashboard — Tableau de bord avec KPIs"),
        bullet("/student/my-courses — Mes cours avec barre de progression"),
        bullet("/student/certificates — Mes certificats avec aperçu et téléchargement"),
        bullet("/student/payments — Historique de paiements"),
        bullet("/student/profile — Modification du profil"),
        bullet("/courses/{id}/watch — Lecteur de cours avec quiz inline"),
        spacer(120),

        h3("7.2.4 Espace Instructeur"),
        bullet("/instructor/dashboard — Tableau de bord avec revenus"),
        bullet("/instructor/courses — Liste et création de cours"),
        bullet("/instructor/courses/{id}/edit — Éditeur de cours (modules, leçons, quiz)"),
        bullet("/instructor/students — Mes étudiants avec recherche"),
        bullet("/instructor/earnings — Revenus et historique"),
        bullet("/instructor/certificates — Certificats émis pour mes cours"),
        spacer(120),

        h3("7.2.5 Espace Administrateur"),
        bullet("/admin/dashboard — Tableau de bord analytique global"),
        bullet("/admin/users — Gestion de tous les utilisateurs"),
        bullet("/admin/courses — Modération des cours"),
        bullet("/admin/categories — Gestion des catégories"),
        bullet("/admin/payments — Transactions et payouts"),
        spacer(200),

        h2("7.3 Composants Clés"),
        spacer(80),

        h3("7.3.1 Lecteur de Cours (courseWatch)"),
        body("Le composant courseWatch est le coeur de l'expérience d'apprentissage :"),
        bullet("Lecteur vidéo MUX avec contrôles natifs"),
        bullet("Barre latérale de navigation avec progression par module/leçon"),
        bullet("Indicateurs visuels de complétion (check vert = complétée)"),
        bullet("Overlay quiz plein écran (z-index élevé, fond semi-opaque maroon) :"),
        bullet("Phase loading : spinner pendant récupération des données", 1),
        bullet("Phase active : questions, options, minuteur, boutons Check/Next/Submit", 1),
        bullet("Phase résultat : score, étoiles, barre de progression dorée, bouton Fermer", 1),
        bullet("Phase violation : écran rouge avec message d'avertissement", 1),
        bullet("Phase review : relecture des réponses après quiz terminé", 1),
        spacer(120),

        h3("7.3.2 Système de Certificats (Frontend)"),
        body("Le design du certificat est reproduit fidèlement dans la preview modale :"),
        bullet("Bandeau gauche maroon foncé avec logo SARALOWE ACADEMY en or"),
        bullet("Rubans dorés verticaux décoratifs sur le bandeau"),
        bullet("Médaille/rosette dorée avec cercle intérieur crème"),
        bullet("Double bordure dorée sur le panneau principal"),
        bullet("Nom de l'étudiant en italique gras couleur bordeaux"),
        bullet("Lignes de signature avec nom instructeur et 'Saralowe Academy'"),
        bullet("Numéro de certificat et URL de vérification en bas"),
        spacer(200),

        h2("7.4 État Global (Redux)"),
        infoTable([
          ["authSlice", "État d'authentification : user, tokens, isAuthenticated, loading"],
          ["enrollmentSlice", "Inscriptions de l'étudiant, progression, cours actif"],
          ["notificationSlice", "Notifications temps réel, compteur non lus"],
          ["uiSlice", "État UI global : sidebar open/closed, thème, modals actives"],
          ["courseSlice", "Données des cours en cache, filtres catalogue"],
        ]),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 8 — FONCTIONNALITES AVANCEES
        // ════════════════════════════════════════════════════════
        h1("8. FONCTIONNALITÉS AVANCÉES"),
        spacer(80),

        h2("8.1 Vidéo avec MUX"),
        body("L'intégration MUX offre une expérience vidéo professionnelle :"),
        spacer(80),
        infoTable([
          ["Upload direct", "L'instructeur obtient une URL signée MUX et upload directement depuis le navigateur"],
          ["Upload serveur", "Alternative : upload via le backend Spring Boot (MultipartFile)"],
          ["Transcoding", "MUX encode automatiquement en HLS adaptatif (multiple bitrates)"],
          ["Playback ID", "ID unique généré par MUX pour le streaming"],
          ["Asset ID", "ID de l'asset MUX stocké en base pour gestion et suppression"],
          ["Thumbnails", "Génération automatique de miniatures par MUX"],
          ["Statut", "États : PREPARING, READY, ERRORED (webhooks MUX)"],
        ]),
        spacer(200),

        h2("8.2 Paiement avec PayZone"),
        body("Le flux de paiement pour les cours payants :"),
        numbered("L'étudiant clique sur 'S'inscrire' sur la page détail du cours"),
        numbered("Le backend initie une session de paiement PayZone (montant en MAD)"),
        numbered("L'étudiant est redirigé vers la page de paiement sécurisée PayZone"),
        numbered("Après paiement, PayZone redirige vers l'URL de callback du backend"),
        numbered("Le backend vérifie la signature du callback et valide la transaction"),
        numbered("L'inscription est créée, l'earning de l'instructeur est généré"),
        numbered("L'étudiant est redirigé vers son espace de cours"),
        spacer(200),

        h2("8.3 Messagerie Temps Réel (WebSocket)"),
        infoTable([
          ["Protocole", "STOMP over SockJS (fallback HTTP long-polling si WebSocket indisponible)"],
          ["Endpoint", "/ws — point de connexion WebSocket"],
          ["Topics", "/topic/notifications/{userId} — notifications personnelles"],
          ["Queue", "/queue/messages — messages privés"],
          ["Authentification", "Token JWT transmis lors de la connexion WebSocket"],
          ["Persistance", "Messages stockés en base de données pour l'historique"],
        ]),
        spacer(200),

        h2("8.4 Génération de Certificats PDF"),
        body("Les certificats sont générés automatiquement avec iText 7 (design luxe) :"),
        spacer(80),
        infoTable([
          ["Déclencheur", "100% des leçons d'un cours complétées par un étudiant"],
          ["Idempotence", "Vérification existence avant création (pas de doublon)"],
          ["Transaction", "REQUIRES_NEW : génération dans sa propre transaction DB"],
          ["Format", "PDF A4 paysage (841×595 pt)"],
          ["Design", "Fond crème, bandeau maroon 28% gauche, accents dorés"],
          ["Éléments", "Logo, titre, nom étudiant, cours, instructeur, date, signatures, numéro"],
          ["Vérification", "URL publique : /verify/{certificateNumber}"],
          ["Numérotation", "CDA-{6 chiffres timestamp}-{8 caractères UUID}"],
        ]),
        spacer(200),

        h2("8.5 Système de Notation (Reviews)"),
        bullet("Les étudiants inscrits peuvent noter un cours (1-5 étoiles)"),
        bullet("Commentaire textuel optionnel"),
        bullet("Un seul avis par étudiant par cours (UNIQUE constraint)"),
        bullet("Note moyenne calculée et affichée sur la page du cours"),
        bullet("Possibilité de modifier son avis"),
        spacer(200),

        h2("8.6 Cache et Performance"),
        infoTable([
          ["Caffeine Cache", "Cache en mémoire JVM pour les données fréquemment lues"],
          ["Données cachées", "Catalogue de cours, détails cours, catégories, profils instructeurs"],
          ["Invalidation", "Automatique à la modification d'un cours ou d'une catégorie"],
          ["Rate Limiting", "Bucket4j : protection contre les appels excessifs à l'API"],
          ["Lazy Loading", "Relations JPA en LAZY loading pour optimiser les requêtes"],
          ["Projections", "DTO projections JPA pour éviter de charger des entités complètes"],
          ["Pagination", "Toutes les listes paginées côté backend avec Spring Data Pageable"],
        ]),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 9 — MIGRATIONS BASE DE DONNEES
        // ════════════════════════════════════════════════════════
        h1("9. MIGRATIONS BASE DE DONNÉES (FLYWAY)"),
        spacer(80),

        h2("9.1 Principe"),
        body("Flyway gère le versioning du schéma de base de données avec des fichiers SQL numérotés. Chaque migration est irréversible et tracée dans la table flyway_schema_history."),
        spacer(120),
        callout("Chemin des migrations : src/main/resources/db/migration/V{version}__{description}.sql"),
        spacer(200),

        h2("9.2 Fichiers de Migration"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1800, 7560],
          rows: [
            headerRow(["Version", "Description"], [1800, 7560]),
            dataRow(["V1", "Création initiale : users, categories, courses, modules, lessons"], [1800, 7560], false),
            dataRow(["V2", "Tables d'inscription et progression : enrollments, lesson_progress"], [1800, 7560], true),
            dataRow(["V3", "Système de quiz : quizzes, quiz_questions, quiz_options, quiz_attempts, quiz_answers"], [1800, 7560], false),
            dataRow(["V4", "Communauté : posts, comments, likes"], [1800, 7560], true),
            dataRow(["V5", "Messagerie : conversations, messages, conversation_participants"], [1800, 7560], false),
            dataRow(["V6", "Finance : payments, earnings, payouts"], [1800, 7560], true),
            dataRow(["V7", "Notifications : notifications"], [1800, 7560], false),
            dataRow(["V8", "Certificats : certificates (avec certificateNumber unique)"], [1800, 7560], true),
            dataRow(["V9", "Avis : course_reviews"], [1800, 7560], false),
            dataRow(["V10+", "Évolutions ultérieures et corrections de schéma"], [1800, 7560], true),
          ],
        }),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 10 — DEPLOIEMENT ET CONFIGURATION
        // ════════════════════════════════════════════════════════
        h1("10. DÉPLOIEMENT ET CONFIGURATION"),
        spacer(80),

        h2("10.1 Prérequis"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 2200, 4360],
          rows: [
            headerRow(["Composant", "Version minimale", "Notes"], [2800, 2200, 4360]),
            dataRow(["Java JDK", "17 LTS", "OpenJDK ou Oracle JDK"], [2800, 2200, 4360], false),
            dataRow(["Maven", "3.9+", "Build tool backend"], [2800, 2200, 4360], true),
            dataRow(["Node.js", "20 LTS", "Runtime JavaScript frontend"], [2800, 2200, 4360], false),
            dataRow(["PostgreSQL", "15+", "Base de données principale"], [2800, 2200, 4360], true),
            dataRow(["Redis", "7+", "Cache et sessions (optionnel en dev)"], [2800, 2200, 4360], false),
          ],
        }),
        spacer(200),

        h2("10.2 Variables d'Environnement Backend"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3600, 5760],
          rows: [
            headerRow(["Variable", "Description"], [3600, 5760]),
            dataRow(["SPRING_DATASOURCE_URL", "jdbc:postgresql://{host}:{port}/{dbname}"], [3600, 5760], false),
            dataRow(["SPRING_DATASOURCE_USERNAME", "Utilisateur PostgreSQL"], [3600, 5760], true),
            dataRow(["SPRING_DATASOURCE_PASSWORD", "Mot de passe PostgreSQL"], [3600, 5760], false),
            dataRow(["JWT_SECRET", "Clé secrète JWT (min. 256 bits, Base64)"], [3600, 5760], true),
            dataRow(["JWT_EXPIRATION", "Durée access token en ms (ex. 900000 = 15min)"], [3600, 5760], false),
            dataRow(["MUX_TOKEN_ID", "Identifiant de l'API MUX"], [3600, 5760], true),
            dataRow(["MUX_TOKEN_SECRET", "Secret de l'API MUX"], [3600, 5760], false),
            dataRow(["PAYZONE_API_KEY", "Clé API de la passerelle de paiement"], [3600, 5760], true),
            dataRow(["PAYZONE_SECRET", "Secret pour validation des callbacks"], [3600, 5760], false),
            dataRow(["MAIL_HOST / MAIL_PORT", "Configuration serveur SMTP"], [3600, 5760], true),
            dataRow(["MAIL_USERNAME / MAIL_PASSWORD", "Credentials SMTP"], [3600, 5760], false),
            dataRow(["FILE_STORAGE_PATH", "Chemin stockage local des fichiers uploadés"], [3600, 5760], true),
            dataRow(["FRONTEND_URL", "URL du frontend (CORS, emails)"], [3600, 5760], false),
          ],
        }),
        spacer(200),

        h2("10.3 Build et Lancement"),
        h3("Backend (Spring Boot)"),
        callout("# Build\nmvn clean package -DskipTests\n\n# Lancement\njava -jar target/academy-backend-*.jar\n\n# Ou avec Maven\nmvn spring-boot:run"),
        spacer(120),
        h3("Frontend (React + Vite)"),
        callout("# Installation des dépendances\nnpm install\n\n# Développement\nnpm run dev\n\n# Production\nnpm run build\nnpm run preview"),
        spacer(200),

        h2("10.4 Variables d'Environnement Frontend"),
        infoTable([
          ["VITE_API_BASE_URL", "URL de l'API backend (ex. https://api.saralowe.academy/api/v1)"],
          ["VITE_WS_URL", "URL WebSocket (ex. wss://api.saralowe.academy/ws)"],
          ["VITE_MUX_ENV_KEY", "Clé d'environnement MUX pour le player vidéo"],
          ["VITE_APP_NAME", "Nom de l'application (Saralowe Academy)"],
        ]),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 11 — CONTRAINTES ET EXIGENCES
        // ════════════════════════════════════════════════════════
        h1("11. CONTRAINTES ET EXIGENCES"),
        spacer(80),

        h2("11.1 Exigences de Performance"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4000, 5360],
          rows: [
            headerRow(["Critère", "Objectif"], [4000, 5360]),
            dataRow(["Temps de réponse API (P95)", "< 300 ms pour les endpoints standards"], [4000, 5360], false),
            dataRow(["Temps de réponse API (P99)", "< 1000 ms pour toutes les requêtes"], [4000, 5360], true),
            dataRow(["Chargement initial frontend", "< 3 secondes (First Contentful Paint)"], [4000, 5360], false),
            dataRow(["Disponibilité (SLA)", "> 99.5% de disponibilité mensuelle"], [4000, 5360], true),
            dataRow(["Utilisateurs simultanés", "Support de 500 utilisateurs concurrents minimum"], [4000, 5360], false),
            dataRow(["Upload vidéo", "Support de fichiers jusqu'à 10 GB via upload direct MUX"], [4000, 5360], true),
          ],
        }),
        spacer(200),

        h2("11.2 Exigences de Sécurité"),
        bullet("Toutes les communications doivent utiliser HTTPS/TLS 1.3"),
        bullet("Les mots de passe doivent respecter : min. 8 caractères, majuscule, chiffre"),
        bullet("Les tokens JWT ne doivent jamais être stockés dans localStorage (utiliser HttpOnly cookies ou mémoire)"),
        bullet("Toutes les entrées utilisateurs doivent être validées et assainies (sanitization)"),
        bullet("Les en-têtes de sécurité HTTP doivent être configurés (HSTS, X-Frame-Options, CSP)"),
        bullet("Les données sensibles (clés API) ne doivent jamais être commitées dans le code source"),
        spacer(200),

        h2("11.3 Exigences de Conformité"),
        bullet("Conformité RGPD : droit à l'oubli, portabilité des données, consentement explicite"),
        bullet("Politique de confidentialité et CGU accessibles publiquement"),
        bullet("Cookies consentement (si analytics tiers utilisés)"),
        bullet("Accessibilité WCAG 2.1 niveau AA (contraste, navigation clavier, ARIA labels)"),
        spacer(200),

        h2("11.4 Contraintes Techniques"),
        bullet("La base de données doit avoir des sauvegardes automatiques quotidiennes"),
        bullet("Les migrations Flyway doivent être testées en environnement staging avant production"),
        bullet("Le code doit maintenir une couverture de tests unitaires > 70%"),
        bullet("Toutes les APIs doivent être documentées via OpenAPI / Swagger"),
        bullet("La pagination est obligatoire pour tous les endpoints retournant des listes"),
        bullet("Les logs doivent inclure : timestamp, level, user_id, request_id pour la traçabilité"),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 12 — PLAN DE TESTS
        // ════════════════════════════════════════════════════════
        h1("12. PLAN DE TESTS"),
        spacer(80),

        h2("12.1 Tests Backend"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 2800, 4160],
          rows: [
            headerRow(["Type", "Outil", "Couverture"], [2400, 2800, 4160]),
            dataRow(["Tests unitaires", "JUnit 5 + Mockito", "Services, utilitaires, helpers"], [2400, 2800, 4160], false),
            dataRow(["Tests d'intégration", "Spring Boot Test + Testcontainers", "Repositories, Services avec DB réelle"], [2400, 2800, 4160], true),
            dataRow(["Tests API (E2E)", "MockMvc / REST Assured", "Tous les endpoints avec auth"], [2400, 2800, 4160], false),
            dataRow(["Tests de sécurité", "Spring Security Test", "Accès refusé, tokens invalides"], [2400, 2800, 4160], true),
          ],
        }),
        spacer(200),

        h2("12.2 Tests Frontend"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 2800, 4160],
          rows: [
            headerRow(["Type", "Outil", "Couverture"], [2400, 2800, 4160]),
            dataRow(["Tests unitaires composants", "Jest + React Testing Library", "Composants réutilisables"], [2400, 2800, 4160], false),
            dataRow(["Tests d'intégration", "MSW (Mock Service Worker)", "Flux complets (inscription, quiz, paiement)"], [2400, 2800, 4160], true),
            dataRow(["Tests E2E", "Playwright / Cypress", "Parcours utilisateur critiques"], [2400, 2800, 4160], false),
          ],
        }),
        spacer(200),

        h2("12.3 Cas de Tests Critiques"),
        bullet("Inscription et connexion avec vérification email"),
        bullet("Inscription à un cours gratuit et payant"),
        bullet("Suivi de progression : lecture vidéo → complétion leçon → mise à jour %"),
        bullet("Quiz : questions, timer, anti-triche, soumission, résultat"),
        bullet("Génération automatique de certificat à 100% de progression"),
        bullet("Téléchargement PDF du certificat (étudiant et instructeur)"),
        bullet("Vérification publique d'un certificat par numéro"),
        bullet("Flux revenus : paiement → earning créé → demande payout → validation admin"),
        bullet("Rate limiting : dépasser la limite → erreur 429"),
        bullet("Accès non autorisé : token expiré → 401, mauvais rôle → 403"),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPITRE 13 — FEUILLE DE ROUTE
        // ════════════════════════════════════════════════════════
        h1("13. FEUILLE DE ROUTE ET ÉVOLUTIONS"),
        spacer(80),

        h2("13.1 Version 1.0 — Fondations (Actuel)"),
        bullet("Authentification complète (JWT + email verification)"),
        bullet("Gestion complète des cours (CRUD + modules + leçons + vidéos MUX)"),
        bullet("Quiz intégrés avec anti-triche"),
        bullet("Suivi de progression en temps réel"),
        bullet("Paiements PayZone (MAD)"),
        bullet("Génération automatique de certificats PDF luxe"),
        bullet("Messagerie temps réel WebSocket"),
        bullet("Communauté (posts, commentaires)"),
        bullet("Tableau de bord instructeur avec revenus"),
        bullet("Panel administrateur complet"),
        spacer(200),

        h2("13.2 Version 1.1 — Amélioration UX"),
        bullet("Système de notes et avis amélioré (réponses aux avis)"),
        bullet("Favoris (wishlist) pour les cours"),
        bullet("Partage de cours sur les réseaux sociaux"),
        bullet("Mode sombre (dark mode)"),
        bullet("Application mobile (React Native) — vue basique"),
        spacer(200),

        h2("13.3 Version 2.0 — Scalabilité"),
        bullet("Migration vers une architecture microservices"),
        bullet("Service de notifications séparé"),
        bullet("Moteur de recherche avancé (Elasticsearch)"),
        bullet("Live sessions (cours en direct) via WebRTC"),
        bullet("Intelligence artificielle : recommandations de cours personnalisées"),
        bullet("Support multilingue complet (i18n)"),
        bullet("Programme d'affiliation et codes promotionnels"),
        spacer(200),

        h2("13.4 Version 3.0 — Expansion"),
        bullet("API publique pour les partenaires"),
        bullet("Plugin LTI pour intégration avec d'autres LMS (Moodle, Canvas)"),
        bullet("Gamification : badges, classements, points d'expérience"),
        bullet("Parcours d'apprentissage (learning paths) structurés"),
        bullet("Certification officielle avec QR code de vérification"),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // ANNEXES
        // ════════════════════════════════════════════════════════
        h1("14. ANNEXES"),
        spacer(80),

        h2("Annexe A — Glossaire"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 6560],
          rows: [
            headerRow(["Terme", "Définition"], [2800, 6560]),
            dataRow(["LMS", "Learning Management System — Système de gestion de l'apprentissage"], [2800, 6560], false),
            dataRow(["SPA", "Single Page Application — Application web à page unique"], [2800, 6560], true),
            dataRow(["JWT", "JSON Web Token — Standard de tokens d'authentification"], [2800, 6560], false),
            dataRow(["ORM", "Object-Relational Mapping — Couche d'abstraction base de données"], [2800, 6560], true),
            dataRow(["RBAC", "Role-Based Access Control — Contrôle d'accès par rôle"], [2800, 6560], false),
            dataRow(["HLS", "HTTP Live Streaming — Format de streaming adaptatif d'Apple"], [2800, 6560], true),
            dataRow(["STOMP", "Simple Text Oriented Messaging Protocol — Protocole de messagerie"], [2800, 6560], false),
            dataRow(["DTO", "Data Transfer Object — Objet de transfert de données"], [2800, 6560], true),
            dataRow(["SLA", "Service Level Agreement — Accord sur le niveau de service"], [2800, 6560], false),
            dataRow(["RGPD", "Règlement Général sur la Protection des Données (GDPR en anglais)"], [2800, 6560], true),
            dataRow(["WCAG", "Web Content Accessibility Guidelines — Directives d'accessibilité web"], [2800, 6560], false),
            dataRow(["MUX", "Service cloud de traitement et streaming vidéo professionnel"], [2800, 6560], true),
            dataRow(["MAD", "Dirham Marocain — Devise officielle du Maroc"], [2800, 6560], false),
            dataRow(["Flyway", "Outil de migration de base de données versionnée"], [2800, 6560], true),
            dataRow(["iText", "Bibliothèque Java de génération et manipulation de PDF"], [2800, 6560], false),
          ],
        }),
        spacer(200),

        h2("Annexe B — Codes de Réponse HTTP Utilisés"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1600, 7760],
          rows: [
            headerRow(["Code", "Signification dans le contexte Saralowe Academy"], [1600, 7760]),
            dataRow(["200 OK", "Requête réussie (GET, PUT réussis)"], [1600, 7760], false),
            dataRow(["201 Created", "Ressource créée (POST réussi : cours, inscription, etc.)"], [1600, 7760], true),
            dataRow(["400 Bad Request", "Données invalides (validation Bean Validation échouée)"], [1600, 7760], false),
            dataRow(["401 Unauthorized", "Token JWT manquant, expiré ou invalide"], [1600, 7760], true),
            dataRow(["403 Forbidden", "Authentifié mais accès interdit (mauvais rôle ou ressource non possédée)"], [1600, 7760], false),
            dataRow(["404 Not Found", "Ressource introuvable (cours, utilisateur, certificat)"], [1600, 7760], true),
            dataRow(["409 Conflict", "Conflit (email déjà utilisé, déjà inscrit à ce cours)"], [1600, 7760], false),
            dataRow(["422 Unprocessable", "Erreur métier (cours non publié, quiz déjà soumis)"], [1600, 7760], true),
            dataRow(["429 Too Many Requests", "Rate limit Bucket4j dépassé"], [1600, 7760], false),
            dataRow(["500 Internal Server Error", "Erreur serveur non prévue (loggée, masquée à l'utilisateur)"], [1600, 7760], true),
          ],
        }),
        spacer(200),

        h2("Annexe C — Structure des Répertoires"),
        h3("Backend"),
        callout(
          "academy-backend/src/main/java/com/academy/\n" +
          "  controller/          API REST controllers (Admin, Instructor, Student, Public)\n" +
          "  service/             Interfaces des services métier\n" +
          "  service/impl/        Implémentations des services\n" +
          "  entity/              Entités JPA (User, Course, Lesson, Quiz, Certificate...)\n" +
          "  entity/enums/        Enumerations (Role, CourseStatus, PostType...)\n" +
          "  repository/          Repositories Spring Data JPA\n" +
          "  dto/request/         DTOs de requête (CreateCourseRequest, LoginRequest...)\n" +
          "  dto/response/        DTOs de réponse (CourseResponse, CertificateResponse...)\n" +
          "  security/            Config JWT, UserPrincipal, SecurityConfig\n" +
          "  exception/           Exceptions métier (ResourceNotFound, Forbidden, BadRequest)\n" +
          "  config/              Configs WebSocket, Cache, CORS, OpenAPI\n" +
          "  resources/db/migration/  Fichiers SQL Flyway V1__ à V10__+"
        ),
        spacer(120),
        h3("Frontend"),
        callout(
          "template/src/\n" +
          "  feature-module/      Pages et composants par domaine métier\n" +
          "  services/api/        Services TypeScript (auth, course, certificate...)\n" +
          "  store/               Redux slices et store configuration\n" +
          "  components/          Composants UI réutilisables\n" +
          "  hooks/               Custom hooks React\n" +
          "  types/               Types TypeScript globaux\n" +
          "  utils/               Fonctions utilitaires\n" +
          "  assets/              Images, icônes, polices"
        ),
        spacer(200),

        // ── FOOTER SIGNATURE ──
        hr(MAROON, 10),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: "SARALOWE ACADEMY — Cahier des Charges Technique", bold: true, size: 20, color: MAROON, font: "Arial" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Version 1.0 | Avril 2025 | Confidentiel", size: 18, color: MID_GRAY, font: "Arial", italics: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "saralowe.academy", size: 18, color: GOLD, font: "Arial" })],
        }),
      ],
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "SARALOWE ACADEMY", bold: true, size: 18, color: MAROON, font: "Arial" }),
                new TextRun({ text: "   |   Cahier des Charges Technique", size: 18, color: MID_GRAY, font: "Arial" }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 1 } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Version 1.0 — Confidentiel   ", size: 16, color: MID_GRAY, font: "Arial", italics: true }),
                new TextRun({ text: "Page ", size: 16, color: MID_GRAY, font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MAROON, font: "Arial", bold: true }),
                new TextRun({ text: " / ", size: 16, color: MID_GRAY, font: "Arial" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MAROON, font: "Arial", bold: true }),
              ],
              alignment: AlignmentType.RIGHT,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 1 } },
            }),
          ],
        }),
      },
    },
  ],
});

// ── Generate ──────────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buffer => {
  const outPath = 'C:\\Users\\PC\\Plateform\\Saralowe_Academy_Cahier_des_Charges.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('Document generated: ' + outPath);
}).catch(err => {
  console.error('Error generating document:', err);
  process.exit(1);
});
