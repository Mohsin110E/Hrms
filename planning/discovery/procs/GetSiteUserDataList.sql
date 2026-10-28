-- =============================================
-- Author:		Gaurav 	
-- Create date: 15/06/2020
-- Description:	get login details
--[dbo].[GetSiteUserDataList] null,'',null,0,200,1,'Name',null,''
-- =============================================
CREATE PROCEDURE [dbo].[GetSiteUserDataList]
	(	  
		@siteId int = null, 
	   @SiteUserId int =null,
	   @UserTypeId varchar(200) = null,
	    @Search varchar(100) = null,
	   @PageNum as int = 0,
	   @PageSize as int=25,
	   @SortOrder AS INT = -1,
	   @SortBy VARCHAR(50) = 'Name',
	   @SiteAccess bit = null,
	   @TotalRowCount as bigint OUTPUT
	)
AS
BEGIN

	SET NOCOUNT ON;
  
	Begin 

	 Declare @TempTable table (SiteUserId int,ProfileId Int,RoleId  tinyint,Name  varchar(100),UserName  nvarchar(500),UserTypeId  smallInt,
	 UserTypeValue  varchar(100),EmployeeCode varchar(100),Password varchar(100))

    Insert into @TempTable
	select SU.SiteUserId,SU.ProfileId,CAST(0 AS tinyint) as RoleId,(ISNULL(P.Name,'') + ' ' +isnull(P.LastName,'')) As Name,DBO.decrypt(SU.UserName) As UserName,SU.UserTypeId,
	UT.Name As UserTypeValue,ISNULL(E.EmployeeCode,'') as EmployeeCode,DBO.decrypt(SU.Password) As Password
	from usr.SiteUser SU(nolock)
    Join usr.Profile P(nolock) on P.ProfileId = SU.ProfileId
    Left Join master.usertype UT (nolock) on UT.UserTypeId = SU.UserTypeId
	Left Join usr.Employee E(nolock) on E.ProfileId = SU.profileId
	   where   (@SiteUserId is null or SU.SiteUserId =  @SiteUserId) and 
	   (@UserTypeId is null or @UserTypeId = '' or SU.UserTypeId IN (select value from dbo.SplitFn(@UserTypeId ,',') )) And
	   (@SiteAccess is null  or ISNULL(p.IsSiteAccess,0) = @SiteAccess)	   
	    and (@siteId is null or e.SiteId=@siteId)		
		order by ProfileId desc

     set @TotalRowCount=(select COUNT(1) from @TempTable)

	 IF @PageNum >= @TotalRowCount
	SET @PageNum = 0

       select * from @TempTable
		ORDER BY 
		CASE WHEN @SortBy =  'Name' AND @SortOrder = 1 THEN Name END ASC,		
        CASE WHEN @SortBy =  'Name' AND @SortOrder = -1 THEN Name END DESC,
		CASE WHEN @SortBy =  'UserName' AND @SortOrder = 1 THEN UserName END ASC,
        CASE WHEN @SortBy =  'UserName' AND @SortOrder = -1 THEN UserName END DESC,
		CASE WHEN @SortBy =  'UserTypeValue' AND @SortOrder = 1 THEN UserTypeValue END ASC,
        CASE WHEN @SortBy =  'UserTypeValue' AND @SortOrder = -1 THEN UserTypeValue END DESC,
		CASE WHEN @SortBy =  'EmployeeCode' AND @SortOrder = 1 THEN EmployeeCode END ASC,
        CASE WHEN @SortBy =  'EmployeeCode' AND @SortOrder = -1 THEN EmployeeCode END DESC
        OFFSET @PageNum ROWS FETCH NEXT (CASE WHEN @PageSize = 0 AND @TotalRowCount = 0 THEN 1 WHEN @PageSize = 0 THEN @TotalRowCount ELSE @PageSize END) ROWS ONLY

	End
	 SET NOCOUNT OFF;   

END
