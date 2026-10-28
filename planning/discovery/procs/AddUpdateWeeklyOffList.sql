-- =============================================

-- Create date	: 14-11-2019
-- Description	: Add/Update weekly off item details
-- =============================================
CREATE PROCEDURE [dbo].[AddUpdateWeeklyOffList]
@WOFListId int,
@WOFId smallint,
@Year smallint,
@SiteId varchar(200),
@Message varchar(MAX) OUTPUT,
@ProfileId int = null
AS
DECLARE @TranCount int
DECLARE @FromDate date,@ToDate date
DECLARE @CountryId INT
DECLARE @SiteName varchar(MAX) = ''
BEGIN
	SET NOCOUNT ON;
	--Set The transaction state
	SET @TranCount = @@trancount;
	IF @TranCount = 0
	BEGIN
		BEGIN TRANSACTION
	END
	ELSE
	BEGIN
		SAVE TRANSACTION AddUpdateTran;
	END

	--Begin Transaction
	BEGIN TRY
	set @Message = 0  ;
		IF @SiteId is not null and (EXISTS(SELECT 1 FROM system.WeeklyOffList WHERE ProfileId is null and(  (@WOFListId = 0 AND [Year] = @Year AND [WOFId] = @WOFId) OR  (WOFListId != @WOFListId AND [Year] = @Year AND [WOFId] = @WOFId))))
		BEGIN
			SET @Message = 11;
		END
		ELSE
		IF @Profileid is not null and (EXISTS(SELECT 1 FROM system.WeeklyOffList WHERE ProfileId =@ProfileId and  [Year] = @Year ))
		BEGIN
			SET @Message = 11;
		END
		BEGIN

			SELECT @SiteName = COALESCE(@SiteName + ', ', '') + T.SiteName FROM 
			(SELECT DISTINCT S.SiteName FROM DBO.SplitFn(@SiteId,',') U
			INNER JOIN system.WeeklyOffList W ON U.Value IN( SELECT VALUE FROM DBO.SplitFn(W.SITEID,',')) AND (@WOFListId = 0 OR W.WOFListId != @WOFListId)
			INNER JOIN master.Site S ON S.SiteId = U.Value
			WHERE W.Year = @Year
			) T

			IF(RTRIM(LTRIM(@SiteName)) !='')
			BEGIN
				SET @Message = 12
			END
			ELSE
			BEGIN
			
				SET @FromDate = CASE WHEN @Year = YEAR(GETDATE()) THEN GETDATE() ELSE CAST((CAST(@Year AS VARCHAR) + '/01/01') AS date) END 
				--SET @FromDate=CAST((CAST(@Year AS VARCHAR) + '/01/01') AS date) --Added by viki for backdate insert while testing
				SET @ToDate = CAST((CAST(@Year AS VARCHAR) + '/12/31') AS date)
				IF(NOT EXISTS(SELECT 1 FROM system.WeeklyOffList WHERE WOFListId = @WOFListId))
				BEGIN
					INSERT INTO system.WeeklyOffList([WOFId],[Year],[SiteId],ProfileId)
						VALUES (@WOFId,@Year,@SiteId,@ProfileId)
					SET @WOFListId = IDENT_CURRENT('system.WeeklyOffList')
					if(@SiteId is not null)
					Begin
					INSERT INTO system.HolidayCalendar (Date,SiteId,WOFListId)
						SELECT [Date],S.Value,@WOFListId FROM 
						dbo.SplitFn(@SiteId,',') S
						INNER JOIN DBO.GetWeeklyOffDatesFn(@FromDate,@ToDate,@WOFId) D ON S.Value !=''
						OPTION (MAXRECURSION 0)
					End
					Else
					Begin
					  	INSERT INTO system.HolidayCalendar (Date,ProfileId,WOFListId)
						SELECT [Date],@ProfiLeId,@WOFListId FROM  DBO.GetWeeklyOffDatesFn(@FromDate,@ToDate,@WOFId) D 
						OPTION (MAXRECURSION 0)
					End
				
				END
				ELSE
				BEGIN

				If(@SiteId is not null)
				Begin
					UPDATE system.WeeklyOffList SET [WOFId] = @WOFId, [Year] = @Year, SiteId = @SiteId
						WHERE WOFListId = @WOFListId

					DELETE FROM System.HolidayCalendar WHERE Date>@FromDate AND WOFListId = @WOFListId

					INSERT INTO System.HolidayCalendar (Date,SiteId,WOFListId)
						SELECT [Date],S.Value,@WOFListId FROM 
						dbo.SplitFn(@SiteId,',') S
						INNER JOIN DBO.GetWeeklyOffDatesFn(@FromDate,@ToDate,@WOFId) D ON S.Value !=''
						OPTION (MAXRECURSION 0)
				End
				Else
				BEgin
				      UPDATE system.WeeklyOffList SET [WOFId] = @WOFId, [Year] = @Year, ProfileId = @ProfileId
						WHERE WOFListId = @WOFListId

					DELETE FROM System.HolidayCalendar WHERE Date>@FromDate AND WOFListId = @WOFListId					
					INSERT INTO system.HolidayCalendar (Date,ProfileId,WOFListId)
						SELECT [Date],@ProfiLeId,@WOFListId FROM  DBO.GetWeeklyOffDatesFn(@FromDate,@ToDate,@WOFId) D 
						OPTION (MAXRECURSION 0)
				End

					
				END
			END
			
		END
		--Commit transaction and exit
		if @TranCount = 0
		BEGIN
			COMMIT;			
		END	
	END TRY
	BEGIN CATCH
		DECLARE  @ErrorNumber int, @ErrorMessage varchar(MAX),@xstate int = XACT_STATE();
		IF (@xstate = -1) OR (@xstate = 1 and @trancount = 0)
		BEGIN
			  ROLLBACK;
		END
		IF @xstate = 1 and @trancount > 0
		BEGIN
			ROLLBACK TRANSACTION AddUpdateTran;
		END
		SELECT @ErrorNumber =ERROR_NUMBER(), @ErrorMessage = ERROR_MESSAGE();
		Insert into system.ExceptionLog (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage, ErrorFrom)
		SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), ERROR_MESSAGE(), 'SP - AddUpdateWeeklyOffList'
		raiserror ('SP - AddUpdateWeeklyOffList : %d: %s', 16, 1, @ErrorNumber, @ErrorMessage);
	END CATCH;
END

