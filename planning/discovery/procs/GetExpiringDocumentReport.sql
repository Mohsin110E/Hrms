
-- =============================================
-- Author:		Divya	
-- Create date: 17/02/2021
-- Description:	get expired document list 
-- [dbo].[GetExpiringDocumentReport] null,91,null,null,1,null,0,126,25,1,'DocumentTitle',null

CREATE PROCEDURE [dbo].[GetExpiringDocumentReport]
	 @ProfileId varchar(Max) = null,
	   @DateRange int = null,	 
	   @DocumentType varchar(1000) = null,
	   @Department varchar(1000) = null,
	   @SiteId int = null, 
	   @IsActive bit = null,
	   @PageNum as int = 0,
	   @loggedInUserId int =null,
	   @PageSize as int=25,
	   @SortOrder AS INT = -1,
	   @SortBy VARCHAR(50) = 'IssueDate',
	   @TotalRowCount as bigint OUTPUT
AS
BEGIN

	SET NOCOUNT ON;
	BEGIN 

		DECLARE @firstDate date,@lastDate date
		SELECT @firstDate=GETUTCDATE();
		SELECT @lastDate=  DATEADD(DAY,7, @firstDate);

		if(@dateRange is not null)
		begin		
			set @lastDate = DATEADD(DAY,@dateRange,GETUTCDATE());
		end
		--else
		--begin
		--	SELECT @lastDate=  DATEADD(YEAR,20,GETUTCDATE());
		--end

		Declare  @userLevel int ,@userType int
		Select @userlevel = TypeLevel,@userType =UserTypeId from ProfileView where ProfileId = @loggedInUserId

		Declare @TempTable table (DocName varchar(500),FolderPath varchar(1000),IssueDate Date,
		ExpiryDate Date,Remarks varchar(2000),IsActive bit,Name varchar(1000),DocumentName varchar(100),
		DocumentTitle varchar(500),DocumentId int,IsSelf bit,EmployeeCode nvarchar(20),Value nvarchar(500))

		
		;WITH d AS
		(
		SELECT *,
				ROW_NUMBER() OVER (PARTITION BY ProfileId,DocumentTypeId ORDER BY [DocumentId] DESC) AS rn
		FROM [HRMS].[Document]
		)

		insert into @TempTable
		SELECT fd.DocName,FolderPath, d.IssueDate,d.ExpiryDate,d.Remarks,d.IsActive,
			p.Name +' '+ IsNull(p.MiddleName,'') +' ' + IsNull( p.LastName,''),dt.DocumentName,
			d.DocumentTitle,d.DocumentId,d.IsSelf,emp.EmployeeCode, ad.Value
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

		where (@profileId is null or d.ProfileId  in (select value from dbo.SplitFn(@ProfileId ,',')))
		AND ISNULL( d.ExpiryDate, ISNULL(CONVERT(date,Value,104),null))>=@firstDate 
		AND ISNULL( d.ExpiryDate, ISNULL(CONVERT(date,Value,104),null))<=@lastDate 
		and ( @documenttype is null or dt.DocumentTypeId  in (select value from dbo.SplitFn(@DocumentType ,',')))
		and ( @siteId is null  or emp.SiteId = @siteId )
		and ( @department is null or pd.DepartmentId   in (select value from dbo.SplitFn(@Department ,',') ))
		and ( @IsActive is null or @IsActive = 0 or d.IsActive = 1)
		and (d.ProfileId =@loggedInUserId or emp.ReportingTo = @loggedInUserId or ut.TypeLevel < @userlevel or @userlevel=4) 
		and p.StatusId=4	--and rn=1 

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


