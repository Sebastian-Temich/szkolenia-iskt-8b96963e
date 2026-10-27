import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Opis zamiaru usunięcia: tytuł i zdanie nazywające skutek. */
export type ZamiarUsuniecia = { id: string; tytul: string; skutek: string };

/** Dialog potwierdzenia twardego usunięcia; anulowanie nie wykonuje zapytań. */
export function DialogUsuwania(props: {
  zamiar: ZamiarUsuniecia | null;
  trwa: boolean;
  onPotwierdz: (id: string) => void;
  onAnuluj: () => void;
}) {
  const { zamiar } = props;
  const anuluj = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog open={zamiar !== null} onOpenChange={(otwarty) => !otwarty && props.onAnuluj()}>
      <AlertDialogContent
        onOpenAutoFocus={(e) => {
          // Fokus startuje na bezpiecznym „Anuluj”, ustawiany ręcznie zamiast automatycznego wyszukiwania.
          e.preventDefault();
          anuluj.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{zamiar?.tytul}</AlertDialogTitle>
          <AlertDialogDescription>{zamiar?.skutek}</AlertDialogDescription>
        </AlertDialogHeader>
        <p className="text-sm text-[var(--text-secondary)]">
          Zalecaną drogą wycofania jest „Wycofaj” (status szkic), bo twarde usunięcie zepsuje
          publiczne linki.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel ref={anuluj}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            disabled={props.trwa}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              if (zamiar) props.onPotwierdz(zamiar.id);
            }}
          >
            Usuń na stałe
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
