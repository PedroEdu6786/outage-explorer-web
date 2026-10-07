import type { NationalObservation } from "../../contracts/observations";
import { Button } from "../../components/atoms/Button";
import { Surface } from "../../components/atoms/Surface";
import { PanelHeader } from "../../components/molecules/PanelHeader";
import { DataTable } from "../../components/organisms/DataTable";
import { observationTable } from "./presentation";

/** `loading` dims retained rows of a superseded range (inert and hidden from assistive technology); the caller owns what is retained. */
export function DailyObservations({ observations, onExplore, loading = false }: { readonly observations: readonly NationalObservation[]; readonly onExplore?: () => void; readonly loading?: boolean }) {
  return <Surface><PanelHeader title="Daily observations" description="All returned observations in the selected range; missing values are unavailable." actions={onExplore && <Button variant="secondary" onClick={onExplore}>Explore dataset</Button>} /><DataTable caption="Daily national observations" loading={loading} data={observationTable(observations)} missingLabel="Observation unavailable" /></Surface>;
}
