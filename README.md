# 🧑‍💻 Portfolio — Personal Developer Website

A dynamic, data-driven portfolio built using **vanilla JavaScript**, focused on simplicity, control, and structured content rendering.

---

## 🎯 Purpose

This project is designed to:

- Present projects and experience in a structured way
- Avoid heavy frameworks
- Maintain full control over rendering and data flow

---

## ⚙️ Tech Stack

- HTML / CSS
- Vanilla JavaScript
- JSON-driven content system

---

## 🧠 Core Idea

Instead of hardcoding UI, the site is driven by a **JSON schema**:

db.json → parsed → validated → rendered dynamically

---

## 🧱 Architecture

JSON Data  
    ↓  
Validation Layer  
    ↓  
Rendering Functions  
    ↓  
DOM

---

## 📄 Content System

The entire site is built from structured JSON:

- Tabs (Projects, Experience, etc.)
- About section
- Social links
- Tech stack

---

## 🔍 Schema Validation

Custom validation ensures structure consistency before rendering:

Utils.Object.isObjectSchemaSame(...)

This prevents:

- malformed data
- runtime rendering issues

Reference:

---

## 🧩 Rendering System

Different content formats:

- Grid (projects)
- About (profile, experience, education)

Dynamic rendering functions:

fn_loadGridContentAsync()  
fn_loadAboutContentAsync()

---

## 🎨 Features

- Dynamic tab-based navigation
- Mobile + desktop layouts
- Font toggling (serif / monospace)
- JSON-driven UI
- Lightweight and dependency-free

---

## ⚠️ Design Choices

- No frameworks → full control, more manual work
- JSON schema → flexible but requires strict validation
- Client-side rendering → simple but not SEO-focused

---

## 🚀 Running

Just open:

index.html

No build step required.

---

## 📌 Future Improvements

- Better animations / transitions
- SEO improvements
- Optional backend integration
- Content editing UI

---

## One-line summary

> A lightweight, JSON-driven portfolio focused on control, structure, and simplicity over frameworks.
