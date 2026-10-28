
create PROCEDURE GetEmployeeDocumentList
	(
	   @ProfileId int = null
	)
AS
BEGIN

	SET NOCOUNT ON;	
				 SELECT distinct do.DocumentId, fd.FileDocId,DocName,FolderPath,FileDocTypeId,fd.CreatedBy,CreatedOn,
				 do.DocumentTypeId,IssueDate, Case when ad.Value is null then null else convert(datetime, ad.Value, 103) end ExpiryDate,
				 Remarks,IsActive,do.ProfileId,CompanyId,IsSelf,DocumentName,
				 p.Name,p.MiddleName,p.LastName,e.EmployeeCode,do.DocumentTitle,do.IdentityNo,ad.Value as Value,
				 p.Name +' '+ISNULL(p.MiddleName,'') +''+ISNULL(p.LastName,'') AS FullName
				 from [HRMS].[Document]  do with(nolock)
				 Join master.documenttype dt with(nolock) on do.DocumentTypeId = dt.DocumentTypeId	   
				 Join master.FileDocMapping fm with(nolock) on fm.DocId = do.DocumentId
				 Join master.Filedoc fd with(nolock) on fd.FileDocId = fm.fileDocId
				 left join usr.Profile p with(nolock) on p.ProfileId = do.ProfileId
				 left join usr.Employee e with(nolock) on e.ProfileId =  p.ProfileId
				 LEFT JOIN [system].[MetaDataDetail] md ON do.[DocumentTypeId]= md.DocumentType and md.DataTypeId=17 --17 is for date
				 LEFT JOIN [master].[AdditinalDocumentValue] ad ON ad.DocumentId = do.DocumentId and ad.MetaDataDetailId= md.MetaDataDetailId
				 left join usr.ProfileDepartment pd with(nolock) on pd.ProfileId =p.ProfileId 
				  where do.ProfileId = @ProfileId		 
				 order by FileDocId desc


	SET NOCOUNT OFF;   

END

