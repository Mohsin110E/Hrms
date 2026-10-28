CREATE VIEW [dbo].[PassportDocView]
AS
SELECT    dc.ProfileId,    IssueDate PassportIssueDate,ad.Value PassportExpiryDate
FROM            HRMS.[Document] dc (nolock)  Inner join
   master.DocumentType ty (nolock) on dc.DocumentTypeId = ty.DocumentTypeId Left JOIN                                
   master.AdditinalDocumentValue ad (nolock)  ON dc.DocumentId = ad.DocumentId Left JOIN
  system.MetaDataDetail md (nolock)  ON ad.MetaDataDetailId = md.MetaDataDetailId 
  and  dc.DocumentTypeId = md.DocumentType  and md.FieldName = 'ExpiryDate' --17 is for date
  where ty.DocumentName = 'Passport' and IsActive = 1 and IsSelf =1

