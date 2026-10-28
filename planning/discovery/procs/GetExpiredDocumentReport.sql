
-- =============================================
-- Author:		Divya	
-- Create date: 17/02/2021
-- Description:	get expired document list 
--  [dbo].[GetExpiredDocumentReport] null,91,null,null,1,null,0,126,25,1,'DocumentTitle',null
-- =============================================
CREATE PROCEDURE GetExpiredDocumentReport
	(
	   @ProfileId varchar(Max) = null,
	   @DocumentType varchar(1000) = null,
	   @Department varchar(1000) = null,
	   @SiteId int = null, 
	   	@VisaTypeId varchar(1000) = null,
		@ContractTypeId varchar(1000) = null,
		@NationalityId varchar(max) = null,
	   @Belongsto bit = null,
	   @FromDate date = null,
	   @ToDate date = null,
	   @LocationId  varchar(1000) = null,
	   @PageNum as int = 0,
	   @loggedInUserId int =null,
	   @PageSize as int=25,
	   @SortOrder AS INT = -1,
	   @SortBy VARCHAR(50) = 'IssueDate',
	   @TotalRowCount as bigint OUTPUT
	)
AS
BEGIN

	SET NOCOUNT ON;
  
	Begin 

		 Declare  @userLevel int ,@userType int
		 Select @userlevel = TypeLevel,@userType =UserTypeId from ProfileView where ProfileId = @loggedInUserId

		  Declare @TempTable table (DocName varchar(500),FolderPath varchar(1000),IssueDate Date,
		  ExpiryDate Date,Remarks varchar(2000),IsActive bit,Name varchar(1000),DocumentName varchar(100),
		  DocumentTitle varchar(500),DocumentId int,IsSelf bit, EmployeeCode nvarchar(20),Value nvarchar(500),
		  ContractType varchar(50),VisaTypeName varchar(200),Nationality nvarchar(100),Department varchar(100),
		  Designation varchar(100),Location varchar(100))

		
		 
	     ;WITH d AS
		(
		   SELECT *,
				 ROW_NUMBER() OVER (PARTITION BY ProfileId,DocumentTypeId ORDER BY [DocumentId] DESC) AS rn
		   FROM [HRMS].[Document] Where IsActive=1
		)

		insert into @TempTable
		SELECT fd.DocName,FolderPath, d.IssueDate,d.ExpiryDate,d.Remarks,d.IsActive,
		 p.Name +' '+ IsNull(p.MiddleName,'') +' ' + IsNull( p.LastName,''),dt.DocumentName,
		 d.DocumentTitle,d.DocumentId,d.IsSelf,emp.EmployeeCode, ad.Value,cy.Text,vt.VisaTypeName,na.NationalityName,
		 dp.DepartmentName,emp.Designation,lo.Text
	     FROM d
		LEFT JOIN  [master].[DocumentType] dd ON d.DocumentTypeId=dd.DocumentTypeId
		LEFT JOIN  master.documenttype dt with(nolock) on d.DocumentTypeId = dt.DocumentTypeId	   
	    LEFT JOIN  master.FileDocMapping fm with(nolock) on fm.DocId = d.DocumentId
	    LEFT JOIN  master.Filedoc fd with(nolock) on fd.FileDocId = fm.fileDocId
		LEFT JOIN [usr].[Employee] emp ON d.ProfileId= emp.ProfileId
		LEFT JOIN [usr].[Profile] p ON d.ProfileId= p.ProfileId
		LEFT JOIN [system].[MetaDataDetail] md ON d.[DocumentTypeId]= md.DocumentType and md.DataTypeId=17 --17 is for date
		LEFT JOIN [master].[AdditinalDocumentValue] ad ON ad.DocumentId = d.DocumentId and ad.MetaDataDetailId= md.MetaDataDetailId
		left join usr.SiteUser SU with(nolock) on SU.ProfileId = p.ProfileId
		left join usr.ProfileDepartment pd with(nolock) on pd.ProfileId =p.ProfileId
		left join master.UserType ut with(nolock) on ut.UserTypeId  = SU.UserTypeId
		Left Join system.Parameter cy ( nolock) on cy.ParameterTypeId = 32 and p.ContractTypeId = cy.ParameterId
		left join [master].[VisaType] vt with(nolock) on vt.VisaTypeId  = p.VisaType
		left Join master.Nationality na with(nolock) on na.NatinalityId = p.Nationality
		left join usr.ProfileDepartment pg with (nolock) on pg.ProfileId =p.ProfileId
		left join master.Department dp with (nolock) on dp.DepartmentId = pg.DepartmentId
		left Join system.Parameter lo with(nolock) on lo.ParameterTypeId = 13 and lo.ParameterId = emp.Location
		  where ISNULL(CONVERT(date,Value,104),null) < getutcdate() 
		  and (@profileId is null or d.ProfileId  in (select value from dbo.SplitFn(@ProfileId ,',')))
		  and (@Belongsto is null or d.IsSelf = @Belongsto )
		  and ( (@Todate is null  and @FromDate is null)  or (@ToDate is null and  ISNULL(CONVERT(date,Value,104),null) >= @FromDate ) or (@FromDate is null and  ISNULL(CONVERT(date,Value,104),null) <= @ToDate ) or ( ISNULL(CONVERT(date,Value,104),null) between @FromDate and @ToDate))
		  and ( @documenttype is null or dt.DocumentTypeId  in (select value from dbo.SplitFn(@DocumentType ,',')))
		  and ( @siteId is null  or emp.SiteId = @siteId or emp.SiteId  is null )
		  and (@LocationId is null or emp.Location in (select value from dbo.splitFn(@LocationId , ',')))
		  and ( @department is null or pd.DepartmentId   in (select value from dbo.SplitFn(@Department ,',') ))
		  and d.IsActive = 1 --( @IsActive is null or @IsActive = 0 or d.IsActive = 1)	
		  and ( @ContractTypeId is null or p.ContractTypeId   in (select value from dbo.SplitFn(@ContractTypeId ,',')))
	      and ( @VisaTypeId is null or p.VisaType   in (select value from dbo.SplitFn(@VisaTypeId ,',')))
		  and ( @NationalityId is null or p.Nationality   in (select value from dbo.SplitFn(@NationalityId ,',')))
		  and (d.ProfileId =@loggedInUserId or emp.ReportingTo = @loggedInUserId or ut.TypeLevel < @userlevel or @userlevel=4) 		  
		  and rn=1 and p.StatusId=4

		  set @TotalRowCount=(select COUNT(1) from @TempTable)

	IF @PageNum >= @TotalRowCount
	SET @PageNum = 0

	    select * from @TempTable 
		ORDER BY 
		CASE WHEN @SortBy =  'DocumentTitle' AND @SortOrder = 1 THEN DocumentTitle END ASC,
        CASE WHEN @SortBy =  'DocumentTitle' AND @SortOrder = -1 THEN DocumentTitle END DESC,
		CASE WHEN @SortBy =  'IssueDate' AND @SortOrder = 1 THEN IssueDate END ASC,
        CASE WHEN @SortBy =  'IssueDate' AND @SortOrder = -1 THEN IssueDate END DESC,
		CASE WHEN @SortBy =  'ExpiryDate' AND @SortOrder = 1 THEN ExpiryDate END ASC,
        CASE WHEN @SortBy =  'ExpiryDate' AND @SortOrder = -1 THEN ExpiryDate END DESC,
		CASE WHEN @SortBy =  'Name' AND @SortOrder = 1 THEN Name END ASC,
        CASE WHEN @SortBy =  'Name' AND @SortOrder = -1 THEN Name END DESC,
		CASE WHEN @SortBy =  'DocumentTypeName' AND @SortOrder = 1 THEN DocumentName END ASC,
        CASE WHEN @SortBy =  'DocumentTypeName' AND @SortOrder = -1 THEN DocumentName END DESC,
		CASE WHEN @SortBy =  'Remarks' AND @SortOrder = 1 THEN Remarks END ASC,
        CASE WHEN @SortBy =  'Remarks' AND @SortOrder = -1 THEN Remarks END DESC,
		CASE WHEN @SortBy =  'IsActive' AND @SortOrder = 1 THEN IsActive END ASC,
        CASE WHEN @SortBy =  'IsActive' AND @SortOrder = -1 THEN IsActive END DESC,
		CASE WHEN @SortBy =  'IsSelf' AND @SortOrder = 1 THEN IsSelf END ASC,
        CASE WHEN @SortBy =  'IsSelf' AND @SortOrder = -1 THEN IsSelf END DESC
        OFFSET @PageNum ROWS FETCH NEXT (CASE WHEN @PageSize = 0 AND @TotalRowCount = 0 THEN 1 WHEN @PageSize = 0 THEN @TotalRowCount ELSE @PageSize END) ROWS ONLY



	 End
	 SET NOCOUNT OFF;   

END

