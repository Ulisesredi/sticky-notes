import { fireEvent, render, screen, within } from "@testing-library/react";
import { CreateNoteModal } from "./CreateNoteModal";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

test("preview follows content and one of eight colors before submitting the draft", () => {
  const onCreate = jest.fn();
  render(<CreateNoteModal mode="create" onCreate={onCreate} onClose={jest.fn()} />);
  expect(screen.getAllByRole("radio")).toHaveLength(8);
  expect((screen.getByRole("button", { name: "Create note" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Note content"), { target: { value: "First line\nSecond line" } });
  fireEvent.click(screen.getByRole("radio", { name: "Mint" }));
  expect(within(screen.getByRole("region", { name: "Note preview" })).getByText(/First line/).textContent)
    .toBe("First line\nSecond line");
  fireEvent.click(screen.getByRole("button", { name: "Create note" }));
  expect(onCreate).toHaveBeenCalledTimes(1);
  expect(onCreate).toHaveBeenCalledWith({ content: "First line\nSecond line", color: "#c8ebda" });
});

test("whitespace cannot create and cancelling discards the draft", () => {
  const onCreate = jest.fn();
  const onClose = jest.fn();
  render(<CreateNoteModal mode="create" onCreate={onCreate} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText("Note content"), { target: { value: "   " } });
  fireEvent.submit(screen.getByRole("button", { name: "Create note" }).closest("form")!);
  expect(onCreate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
