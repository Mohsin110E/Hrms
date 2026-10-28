
CREATE VIEW [dbo].[VisaDocView]
AS
SELECT    dc.ProfileId,    IssueDate VisaIssueDate,ad.Value VisaExpiryDate
FROM            HRMS.[Document] dc (nolock)  Inner join
   master.DocumentType ty (nolock) on dc.DocumentTypeId = ty.DocumentTypeId Left JOIN                                
   master.AdditinalDocumentValue ad (nolock)  ON dc.DocumentId = ad.DocumentId Left JOIN
  system.MetaDataDetail md (nolock)  ON ad.MetaDataDetailId = md.MetaDataDetailId and  dc.DocumentTypeId = md.DocumentType  and md.FieldName = 'ExpiryDate'  --17 is for date
  where ty.DocumentName = 'Visa' and IsActive = 1 and IsSelf = 1

