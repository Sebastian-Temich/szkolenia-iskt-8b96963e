import { render, screen } from "@testing-library/react";
import { DialogUsuwania } from "@/components/panel/DialogUsuwania";
it("probe", async () => {
  render(<div><DialogUsuwania zamiar={{ id: "a", tytul: "T", skutek: "S" }} trwa={false} onPotwierdz={() => {}} onAnuluj={() => {}} /></div>);
  expect(await screen.findByRole("alertdialog")).toBeDefined();
});
