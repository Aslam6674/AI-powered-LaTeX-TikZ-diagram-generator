# LaTeX Diagram Generator — AI Agent

An intelligent agent that converts natural language descriptions into professional **TikZ** code for LaTeX academic documents, powered by **IBM Granite** on **IBM Watson Studio**.

---

## Architecture

```
LaTeXDiagramAgent/
├── frontend/          # Next.js 14 app (chat UI + code panel)
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Main application shell
│       │   └── api/diagram/route.ts  # Server-side Granite API proxy
│       └── components/
│           ├── TopBar.tsx
│           ├── WelcomeBanner.tsx
│           ├── DiagramTypeSelector.tsx
│           ├── StyleSelector.tsx
│           ├── ChatPanel.tsx
│           ├── TikZCodeBlock.tsx
│           └── TikZCodePanel.tsx
└── mcp-server/        # MCP server exposing TikZ tools to Bob
    └── src/index.ts
```

---

## Features

| Feature | Description |
|---|---|
| **Natural language → TikZ** | Describe any diagram; Granite generates compilable TikZ |
| **10 diagram types** | Flowchart, neural network, block diagram, state machine, sequence, tree, graph, circuit, timeline, mindmap |
| **Plain-English refinement** | "Make the decision diamond red", "Add a dashed arrow from A to C" |
| **Style presets** | Minimal / Standard / Detailed |
| **Explain & Improve** | AI analysis of existing TikZ with publication-quality suggestions |
| **Wrap in LaTeX Doc** | One-click standalone document generation for immediate compilation |
| **MCP tools** | 5 tools available to Bob: generate, refine, explain, wrap, list templates |

---

## Supported Diagram Types

- **Flowchart** — ANSI/ISO symbols (process, decision, start/end)
- **Neural Network** — multi-layer perceptron with labeled nodes and edges
- **Block Diagram** — system architecture subsystems with arrows
- **State Machine** — FSM with labeled transitions
- **Sequence Diagram** — actor interaction timelines
- **Tree** — binary/n-ary labeled trees
- **Graph** — directed/undirected with weighted edges
- **Circuit** — logic gate diagrams
- **Timeline** — horizontal milestone charts
- **Mindmap** — topic branch hierarchies

---

## Quick Start — Frontend

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure credentials

```bash
cp .env.local.example .env.local
# Edit .env.local with your IBM Cloud API key and Watson Studio Project ID
```

Get your credentials:
- **GRANITE_API_KEY**: IBM Cloud Console → Manage → Access → API Keys
- **WATSON_PROJECT_ID**: Watson Studio → Your Project → Manage → General → Project ID

### 3. Run

```bash
npm run dev
# Opens at http://localhost:3000
```

---

## Quick Start — MCP Server (Bob integration)

### 1. Install and build

```bash
cd mcp-server
npm install
npm run build
```

### 2. Register in Bob's `mcp.json`

```json
{
  "mcpServers": {
    "latex-diagram": {
      "command": "node",
      "args": ["d:/IBM/LaTeXDiagramAgent/mcp-server/build/index.js"],
      "env": {
        "GRANITE_API_KEY": "your_key",
        "WATSON_PROJECT_ID": "your_project_id"
      }
    }
  }
}
```

### 3. Use in Bob

Once connected, you can ask Bob:
- *"Generate a TikZ flowchart for a 3-step CI/CD pipeline"*
- *"Refine this TikZ diagram to add color to the decision nodes"*
- *"Explain this TikZ code and suggest improvements"*

---

## IBM Technology Stack

| Component | IBM Service |
|---|---|
| Language Model | IBM Granite 3.3 8B Instruct (`ibm/granite-3-3-8b-instruct`) |
| Inference API | IBM Watson Studio ML API (WML) |
| Authentication | IBM Cloud IAM (API key → Bearer token) |
| Deployment | IBM Watson Studio Projects |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GRANITE_API_KEY` | ✅ | — | IBM Cloud API key |
| `WATSON_PROJECT_ID` | ✅ | — | Watson Studio project ID |
| `GRANITE_API_URL` | ❌ | `https://us-south.ml.cloud.ibm.com/ml/v1/text/generation` | WML endpoint (region-specific) |
| `GRANITE_MODEL_ID` | ❌ | `ibm/granite-3-3-8b-instruct` | Granite model deployment ID |

---

## Compilation of Generated Diagrams

To compile TikZ output:

```bash
# For standalone .tikz files (use "Wrap Doc" button first)
pdflatex diagram.tex
# or
xelatex diagram.tex
```

Minimum LaTeX preamble required:
```latex
\usepackage{tikz}
\usetikzlibrary{arrows.meta,shapes,positioning,fit,calc,decorations.pathreplacing}
```
