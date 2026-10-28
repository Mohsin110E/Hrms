

-- =============================================
-- Author:		Divya	
-- Create date: 28/02/2021
-- Description:	get login details
--  [dbo].[GetExpiredDocumentList] null,91,null,null,null,1,null,null
-- =============================================
CREATE PROCEDURE [dbo].[GetExpiredDocumentList]
	(
	   
	   @ProfileId int = null,
	   @dateRange int = null,
	   @role int = null,
	   @documenttype int = null,
	   @department int = null,
	   @siteId int = null, 
	   @statusId int=null,
	   @IsSelfStatus int = null
	)
AS
BEGIN

	SET NOCOUNT ON;
  
	Begin 
		Declare @IsActive bit = 1,@ActiveuserstatusId int
    	if(@statusId = 1)		 
		   set @IsActive = 1
		Else if(@statusId = 2 )
		   Set @IsActive = 0

		Declare @IsSelfStatusValue bit = null
    	if(@IsSelfStatus = 1)		 
		   set @IsSelfStatusValue = 1
		Else if(@IsSelfStatus = 2 )
		   Set @IsSelfStatusValue = 0

        declare @now date = getutcdate()
		SELECT @ActiveuserstatusId= ParameterId FROM [dbo].[GetParameterFn](null,2,1,null);

		Declare @TempTable table (FileDocId bigint, DocName varchar(500),FolderPath varchar(1000),FileDocTypeId smallint,CreatedBy int, CreatedOn Date,
		DocumentId bigint, DocumentTypeId smallint, IssueDate Date,
		  ExpiryDate Date,Remarks varchar(2000),IsActive bit,ProfileId int,CompanyId int, IsSelf bit,DocumentName varchar(100),
		  Name varchar(1000),MiddleName varchar(1000),LastName  varchar(1000),
		  EmployeeCode nvarchar(20),DocumentTitle varchar(500),IdentityNo varchar(500),Value nvarchar(500))
		
		 ;WITH d AS
		(
		   SELECT *,
				 ROW_NUMBER() OVER (PARTITION BY ProfileId,DocumentTypeId ORDER BY [DocumentId] DESC) AS rn
		   FROM [HRMS].[Document] --Where IsActive=@IsActive
		)

		insert into @TempTable
	     SELECT distinct fd.FileDocId,DocName,FolderPath,FileDocTypeId,fd.CreatedBy,CreatedOn,
	     do.DocumentId,do.DocumentTypeId,IssueDate,ExpiryDate,Remarks,IsActive,do.ProfileId,CompanyId,IsSelf,DocumentName,
		 p.Name,p.MiddleName,p.LastName,e.EmployeeCode,do.DocumentTitle,do.IdentityNo,ad.Value
	     from d do with(nolock)
	     Join master.documenttype dt with(nolock) on do.DocumentTypeId = dt.DocumentTypeId	   
	     Join master.FileDocMapping fm with(nolock) on fm.DocId = do.DocumentId
	     Join master.Filedoc fd with(nolock) on fd.FileDocId = fm.fileDocId
		 left join usr.Profile p with(nolock) on p.ProfileId = do.ProfileId
		 left join usr.Employee e with(nolock) on e.ProfileId =  p.ProfileId
		 LEFT JOIN [system].[MetaDataDetail] md ON do.[DocumentTypeId]= md.DocumentType and md.DataTypeId=17 --17 is for date
		 LEFT JOIN [master].[AdditinalDocumentValue] ad ON ad.DocumentId = do.DocumentId and ad.MetaDataDetailId= md.MetaDataDetailId
		 left join usr.ProfileDepartment pd with(nolock) on pd.ProfileId =p.ProfileId
		  where (@profileId is null or do.ProfileId = @profileId)
		  and ( @documenttype is null or dt.DocumentTypeId = @documenttype)
		  and ( @siteId is null  or e.SiteId = @siteId )
		  and ( @department is null or pd.DepartmentId = @department)
			and ( @IsActive is null or do.IsActive = @IsActive)
		 -- and ( @IsActive = 0 or @IsActive is null or (@IsActive = 1 ))
		  and ( ISNULL( do.ExpiryDate, ISNULL(CONVERT(date,Value,104),null))<=GETUTCDATE())
		  and ( @IsSelfStatusValue is null or do.IsSelf = @IsSelfStatusValue)
		  and rn=1 and p.StatusId=@ActiveuserstatusId

		   select * from @TempTable  order by ExpiryDate desc
	 End
	 SET NOCOUNT OFF;   

END

