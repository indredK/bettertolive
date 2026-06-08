import {
  getBetterToLiveApi,
  type BeliefEntryForm,
} from "@/features/bettertolive/api/bettertolive-api"
import type { BeliefEntry, BeliefsModuleData } from "@/features/bettertolive/models/workspace"

export type { BeliefEntryForm }

export async function getBeliefsModule(): Promise<BeliefsModuleData> {
  return getBetterToLiveApi().getBeliefs()
}

export async function createBeliefEntry(form: BeliefEntryForm): Promise<BeliefEntry> {
  return getBetterToLiveApi().createBeliefEntry(form)
}

export async function updateBeliefEntry(form: BeliefEntryForm): Promise<BeliefEntry> {
  return getBetterToLiveApi().updateBeliefEntry(form)
}

export async function deleteBeliefEntry(id: string): Promise<void> {
  return getBetterToLiveApi().deleteBeliefEntry(id)
}
