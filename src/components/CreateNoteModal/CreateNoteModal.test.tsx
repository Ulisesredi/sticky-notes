import { fireEvent, render, screen, within } from "@testing-library/react";
import { CreateNoteModal } from "./CreateNoteModal";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

test("preview follows content and one of eight colors before submitting the draft", () => {
  const onCreate = jest.fn();
  render(<CreateNoteModal mode="create" initialGeometry={{ x: 16, y: 72, width: 180, height: 180 }}
    maxX={700} maxY={500} onCreate={onCreate} onClose={jest.fn()} />);
  expect(screen.getAllByRole("radio")).toHaveLength(8);
  expect((screen.getByRole("button", { name: "Create note" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Note content"), { target: { value: "First line\nSecond line" } });
  fireEvent.click(screen.getByRole("radio", { name: "Mint" }));
  fireEvent.change(screen.getByLabelText("X"), { target: { value: "240" } });
  fireEvent.change(screen.getByLabelText("Y"), { target: { value: "120" } });
  expect(within(screen.getByRole("region", { name: "Note preview" })).getByText(/First line/).textContent)
    .toBe("First line\nSecond line");
  fireEvent.click(screen.getByRole("button", { name: "Create note" }));
  expect(onCreate).toHaveBeenCalledTimes(1);
  expect(onCreate).toHaveBeenCalledWith({ content: "First line\nSecond line", color: "#c8ebda", x: 240, y: 120 });
});

test("whitespace cannot create and cancelling discards the draft", () => {
  const onCreate = jest.fn();
  const onClose = jest.fn();
  render(<CreateNoteModal mode="create" initialGeometry={{ x: 16, y: 72, width: 180, height: 180 }}
    maxX={700} maxY={500} onCreate={onCreate} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText("Note content"), { target: { value: "   " } });
  fireEvent.submit(screen.getByRole("button", { name: "Create note" }).closest("form")!);
  expect(onCreate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
