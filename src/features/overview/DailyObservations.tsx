import type { NationalObservation } from "../../contracts/observations";
import { Button } from "../../components/atoms/Button";
import { Surface } from "../../components/atoms/Surface";
import { PanelHeader } from "../../components/molecules/PanelHeader";
import { DataTable } from "../../components/organisms/DataTable";
import { observationTable } from "./presentation";

export function DailyObservations({ observations, onExplore }: { readonly observations: readonly NationalObservation[]; readonly onExplore?: () => void }) {
  return <Surface><PanelHeader title="Daily observations" description="All returned observations in the selected range; missing values are unavailable." actions={onExplore && <Button variant="secondary" onClick={onExplore}>Explore dataset</Button>} /><DataTable caption="Daily national observations" data={observationTable(observations)} missingLabel="Observation unavailable" /></Surface>;
}
