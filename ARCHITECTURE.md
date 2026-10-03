# Architecture

The board owns the notes collection with React's `useReducer`. Each note stores its ID, text, color, position, and size. The reducer handles confirmed changes such as creating, editing, moving, resizing, deleting, and bringing a note to the front. The interface is split into focused components for the board, sticky notes, the creation and editing dialog, the trash area, and shared saving feedback.

Pointer interaction is isolated in a custom hook. During a drag or resize, the hook keeps temporary geometry in refs and updates the note's element directly, avoiding React renders for every pointer movement. On release, the final geometry is committed once to the reducer, cancellation restores the original geometry. Pure geometry utilities calculate bounds and initial note placement, while explicit element references are used for pointer tracking and trash hit testing.

Confirmed board changes are saved to `localStorage` and sent to an asynchronous in-memory API mock after a one-second debounce. Both destinations receive the same versioned snapshot, and the mock ignores older versions that arrive late. The local snapshot is validated and restored when the page loads, the API mock is for demonstration and resets when the application reloads.
