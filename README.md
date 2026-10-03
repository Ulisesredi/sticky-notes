# Sticky Notes

A simple desktop sticky-note board for capturing and arranging ideas. Create notes with text and a color, choose where they appear, then move, resize, edit, and delete them directly on the board.

## Features

- Create a note with text, one of eight preset colors, and a live preview.
- Choose the note's horizontal and vertical position in pixels. The board suggests an open, slightly staggered position by default.
- Move notes by dragging their header and resize them from the bottom-right corner.
- Edit a note's text and color, and bring it to the front by selecting it.
- Delete a note by dragging it into the trash area in the bottom-right corner of the board.
- Restore notes after a reload using browser storage. Changes are saved after a one-second pause; a status message appears while saving.
- Send the same versioned note snapshot to an asynchronous mock API. The mock runs in the browser and keeps data in memory, so it is for demonstration and does not replace a server.

The board is designed for desktop screens of 1024 × 768 pixels or larger. New notes default to a square size equal to 25% of the viewport height, limited by the available board space; width and height can be changed in the creation dialog. Coordinates are measured from the board's top-left corner.

## Getting started

Install Node.js 22 LTS and npm, then run:

```sh
npm ci
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project structure

The application is built with React and TypeScript. The `Board` component owns the list of notes and updates it through a reducer. Each note stores its text, color, position, and size. The board also coordinates creation, editing, deletion, saving, and the shared saving indicator.

The interface is split into small components for the board, notes, the creation and editing dialog, the trash area, and shared feedback. A dedicated interaction hook handles dragging and resizing. While a pointer gesture is active, it updates the note's visual position directly; when the gesture ends, it commits the final geometry to React state. This keeps frequent pointer movement from causing unnecessary component updates.

Geometry calculations live in standalone utilities. Confirmed changes are saved to browser storage and sent to the mock API after a one-second debounce. Both destinations receive the same incrementing version, allowing the mock API to ignore older updates that arrive late. The local copy survives a page reload; the mock API's in-memory copy does not.

## Available commands

```sh
npm start
npm test -- --watchAll=false
npx tsc --noEmit
npm run build
```

The automated tests cover note interactions, cancellation, board boundaries, the reducer, and the creation dialog.
