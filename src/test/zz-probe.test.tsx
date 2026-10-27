import { render, screen } from "@testing-library/react";
import { DialogUsuwania } from "@/components/panel/DialogUsuwania";
it("probe", async () => {
  render(<html><body><DialogUsuwania zamiar={{ id: "a", tytul: "T", skutek: "S" }} trwa={false} onPotwierdz={() => {}} onAnuluj={() => {}} /></body></html>);
  expect(await screen.findByRole("alertdialog")).toBeDefined();
});
