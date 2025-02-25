export class UpdateOpportunityDto {
  reasonBuyId: number | null;
  reasonAnulationId: number | null;
  diagnosisId: number | null;
  doseId: number | null;
  treatmentTimeId: string;
  lastDateTaken: string;
  dateAbandonTreatment: string;
  observations: string;
}
