
-- =============================================
-- Author:		Mohseena	
-- Create date: 12/29/2019
-- Description:	get document list 
--  [dbo].[GetDocumentReport] null,91,null,null,1,null,0,126,25,1,'DocumentTitle',null
-- =============================================
CREATE PROCEDURE GetDocumentReport
	(
	   
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
	)
AS
BEGIN

	SET NOCOUNT ON;
  
	Begin 
	--Declare @IsActive bit = null
 --   	if(@statusId = 1)		 
	--	   set @IsActive = 1
	--	Else if(@statusId = 2 )
	--	   Set @IsActive = 0

		declare @nextweek date
        declare @now date = getutcdate()
		 
		 if(@dateRange is not null)
		 begin		
         set @nextweek = dateadd(day,@dateRange,@now);
         end

		 print @nextweek
		 Declare  @userLevel int ,@userType int
		 Select @userlevel = TypeLevel,@userType =UserTypeId from ProfileView where ProfileId = @loggedInUserId

		  Declare @TempTable table (DocName varchar(500),FolderPath varchar(1000),IssueDate Date,
		  ExpiryDate Date,Remarks varchar(2000),IsActive bit,Name varchar(1000),DocumentName varchar(100),
		  DocumentTitle varchar(500),IdentityNo varchar(200),IsSelf bit,Value varchar(100))

		
		 insert into @TempTable
	     SELECT distinct DocName,FolderPath,IssueDate,ExpiryDate,Remarks,do.IsActive,
		 p.Name +' '+ IsNull(p.MiddleName,'') +' ' + IsNull( p.LastName,''),dt.DocumentName,
		 do.DocumentTitle,do.IdentityNo,do.IsSelf,ad.Value
	     from HRMS.Document do with(nolock)
	     Join master.documenttype dt with(nolock) on do.DocumentTypeId = dt.DocumentTypeId	   
	     Join master.FileDocMapping fm with(nolock) on fm.DocId = do.DocumentId
	     Join master.Filedoc fd with(nolock) on fd.FileDocId = fm.fileDocId
		 join usr.Profile p with(nolock) on p.ProfileId = do.ProfileId
		 left join usr.SiteUser SU with(nolock) on SU.ProfileId = p.ProfileId
		 join usr.Employee e with(nolock) on e.ProfileId =  p.ProfileId
		 left join usr.ProfileDepartment pd with(nolock) on pd.ProfileId =p.ProfileId
		 left join master.UserType ut with(nolock) on ut.UserTypeId  = SU.UserTypeId
		 LEFT JOIN [system].[MetaDataDetail] md ON do.[DocumentTypeId]= md.DocumentType and md.DataTypeId=17 --17 is for date
		 LEFT JOIN [master].[AdditinalDocumentValue] ad ON ad.DocumentId = do.DocumentId and ad.MetaDataDetailId= md.MetaDataDetailId
				
		  where (@profileId is null or do.ProfileId  in (select value from dbo.SplitFn(@ProfileId ,',')))
		--  and  ( @dateRange is null  or (do.ExpiryDate is not  null and ((cast (do.ExpiryDate as DATE)  between cast (GETDATE() as DATE)  and  cast (DATEADD(Day,@dateRange, GETDATE()) as DATE)))))
	       and ( @dateRange is null  or (@dateRange  <> 91 and do.ExpiryDate <= (CAST( @nextweek  as date))) 
		         or (@dateRange  = 91 and do.ExpiryDate >= (CAST( @nextweek  as date))))
		  -- between  (SELECT CAST(GETDATE() AS DATE))  AND  (SELECT CAST(DATEADD(day,@dateRange, GETDATE()) AS DATE)))
		  and ( @documenttype is null or dt.DocumentTypeId  in (select value from dbo.SplitFn(@DocumentType ,',')))
		  and ( @siteId is null  or e.SiteId = @siteId )
		  and ( @department is null or pd.DepartmentId   in (select value from dbo.SplitFn(@Department ,',') ))
		  and ( @IsActive is null or @IsActive = 0 or do.IsActive = 1)
		 -- and (@IsActive = 0 or @IsActive is null or (@IsActive = 1 and  do.ExpiryDate > @now))
		    and (do.ProfileId =@loggedInUserId or e.ReportingTo = @loggedInUserId or ut.TypeLevel < @userlevel) 

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
        CASE WHEN @SortBy =  'IsSelf' AND @SortOrder = -1 THEN IsSelf END DESC,
		CASE WHEN @SortBy =  'IdentityNo' AND @SortOrder = 1 THEN IdentityNo END ASC,
        CASE WHEN @SortBy =  'IdentityNo' AND @SortOrder = -1 THEN IdentityNo END DESC
        OFFSET @PageNum ROWS FETCH NEXT (CASE WHEN @PageSize = 0 AND @TotalRowCount = 0 THEN 1 WHEN @PageSize = 0 THEN @TotalRowCount ELSE @PageSize END) ROWS ONLY



	 End
	 SET NOCOUNT OFF;   

END

