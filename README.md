# Sticky Notes

Incremental implementation of the Team International assessment. React + TypeScript, with custom components and no state or interaction libraries.

## Run

Use Node.js 22 LTS and npm.

```sh
npm ci
npm start
```

Open http://localhost:3000. The desktop layout targets 1024 × 768 and larger screens.

```sh
npm run build
npm test -- --watchAll=false
npx tsc --noEmit
```

## Current behavior

- The floating New note button opens a native modal with required content, eight preset colors, and a live preview. Cancel or Escape discards the draft. New notes start in the upper-left corner, staggered so overlapping notes remain selectable. Each note is offset in a grid by 22% of its size (between 24 and 48 px). Width and height both start at 25% of the viewport height and clamp to the board.
- Select a note to bring it to the front. Edit its content and color with the pencil button; move from the drag handle and resize from the bottom-right corner.
- Geometry commits only on pointer release. Escape, pointer cancellation, lost capture, window blur, a hidden tab, and window resize cancel the gesture.
- The board fills the browser viewport with 32 px of outer padding and no scrolling. Its title and note count float over the canvas without intercepting pointer events. Gesture bounds are measured from the actual board; the minimum note size remains 48 × 48.
- Delete by releasing a move gesture over the trash zone inside the bottom-right corner of the board. The trash stays anchored inside the board and remains visible in the supported desktop layout. Only its visible portion accepts drops; resize gestures never delete. Entering the zone highlights both the target and the note; leaving or cancelling keeps the note.
- Newer notes appear over older ones; an interacting note is temporarily raised. Permanent bring-to-front is deferred.
- Content and color are selected at creation. Later editing, persistence, and REST integration are deferred. Reloading clears the board.

## Architecture

The Board component owns a notes array through useReducer. The model contains identity, content, a typed preset color, and committed geometry. The reducer can update note content/color and bring a note to the front. A pure reducer handles creation, geometry commits, and deletion; IDs are generated before dispatch. Components receive data and callbacks, without Context or an external state store.

The interaction hook captures one primary pointer on a dedicated move or resize handle. Gesture data stays outside React state, and requestAnimationFrame batches temporary style updates. The hook exclusively owns geometry styles and synchronizes them with committed props through a layout effect. On release it uses the final pointer coordinates, cleans up tracking, and dispatches either one geometry result or a deletion through callbacks; cancellation restores the original geometry. A shared ref prevents overlapping gestures. Trash hit testing uses element refs and viewport rectangles, recalculated during scrolling and on release. React state updates trash feedback only when the pointer enters or leaves the target.

Geometry calculations are pure utilities. Coordinates are relative to the board, accounting for viewport scrolling. UI, model, interaction logic, and geometry calculations have separate files. The initial iteration retains Create React App from the supplied project; later tooling or behavior changes can be evaluated independently.

## Verification

36 automated tests cover pointer gestures, cancellation, scrolling, boundary handling, reducer behavior, and drag-to-trash (fast release, leaving the target, resize isolation, cancellation over trash, and clipped targets). TypeScript validation and production build pass. Browser review covers creation, color selection, editing an existing note, and the selected front note. The current layout was checked through browser DOM geometry: 32 px outer spacing, no document or board overflow, an absolute non-interactive header, and no inline creation form. The modal flow was subsequently checked in the browser, including preview, preset color, multiline content, and 25%-height sizing. Full visual and cross-browser QA remain pending.

The inherited Create React App dependency tree reports 70 npm audit findings (3 low, 4 moderate, 63 high). No forced dependency upgrades were applied in this iteration. Review the build tooling separately before delivery.
