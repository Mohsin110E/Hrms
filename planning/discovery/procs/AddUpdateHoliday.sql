-- =============================================

-- Create date	: 07-Jan-2017
-- Description	: Add Update Holiday Details.
-- =============================================
CREATE PROCEDURE [dbo].[AddUpdateHoliday]
@HolidayDate datetime = NULL,
@SiteId varchar(200), 
@HolidayListId smallint,
@PrevHolidayListId smallint,
@PrevHolidayDate datetime,
@Message varchar(500) OUTPUT,
@ProfileId  int = null
AS
DECLARE @TranCount int
--DECLARE @HolidayType int
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
	
		--SELECT @HolidayType = Attribute_Id FROM Parameter WHERE ParameterTypeId = 19 AND Attribute_Value = 1
		IF(@PrevHolidayListId = 0) -- check if the operation is insert or update
		BEGIN
			IF(EXISTS(SELECT 1 FROM system.HolidayCalendar WHERE Date = CONVERT(date,@HolidayDate,103) AND HolidayListId = @HolidayListId and ((@SiteId is not null and SiteId in(select value from DBO.SplitFn(@SiteId,',')) ) or (@ProfileId is not null and ProfileId =@ProfileId)  )))
			BEGIN
				SET @Message = 10;
			END
			ELSE
			BEGIN
			IF @SiteId is not null and (EXISTS(SELECT 1 FROM system.HolidayCalendar WHERE Date = CONVERT(date,@HolidayDate,103) and  SiteId in(select value from DBO.SplitFn(@SiteId,','))))
			  begin
			  DELETE FROM  system.HolidayCalendar WHERE Date = @HolidayDate and  SiteId in(select value from DBO.SplitFn(@SiteId,','))
			  end
			eLSE
			BEGIN
			IF @ProfileId is not null and (EXISTS(SELECT 1 FROM system.HolidayCalendar WHERE Date = CONVERT(date,@HolidayDate,103) and  ProfileId =@ProfileId ))
			  begin
			  DELETE FROM  system.HolidayCalendar WHERE Date = @HolidayDate and  ProfileId =@ProfileId
			  end
            End

			  if @SiteId is not null 
			  Begin
				INSERT INTO system.HolidayCalendar(Date,SiteId,HolidayListId)
				SELECT CONVERT(date,@HolidayDate,103) , Value AS SiteId, @HolidayListId
					FROM DBO.SplitFn(@SiteId,',')
			  End
			  Else
			  Begin
				INSERT INTO system.HolidayCalendar(Date,ProfileId,HolidayListId)
				SELECT CONVERT(date,@HolidayDate,103) ,@ProfileId, @HolidayListId
			  End
				SET @Message = 5;
			END
		END
		ELSE
		BEGIN
			
			if(@Siteid is not null)
			Begin
			DELETE FROM  system.HolidayCalendar WHERE Date = @PrevHolidayDate AND HolidayListId = @PrevHolidayListId -- here @IsAdd Contains the Previous HolidayListId
			declare @tempSiteId varchar(200),@singleSiteId as varchar(5)
			set  @tempSiteId=@SiteId			
			while len(@tempSiteId) > 0
			begin			  
			  set @singleSiteId=left(@tempSiteId, charindex(',', @tempSiteId+',')-1)
			  if exists(select 1 from system.HolidayCalendar where Date=@HolidayDate and SiteId=@singleSiteId)
			  BEGIN
			     delete from system.HolidayCalendar where Date=@HolidayDate and SiteId=@singleSiteId
			  END
			  set @tempSiteId = stuff(@tempSiteId, 1, charindex(',', @tempSiteId+','), '')  
			end
			
			INSERT INTO system.HolidayCalendar(Date,SiteId,HolidayListId)
				SELECT @HolidayDate , Value AS SiteId, @HolidayListId
					FROM DBO.SplitFn(@SiteId,',')
			End
			Else if(@ProfileId is not null)
			Begin			 
			DELETE FROM  system.HolidayCalendar WHERE Date = @PrevHolidayDate AND HolidayListId = @PrevHolidayListId -- here @IsAdd Contains the Previous HolidayListId
			
			  if exists(select 1 from system.HolidayCalendar where Date=@HolidayDate and profileId=@ProfileId)
			  BEGIN
			     delete from system.HolidayCalendar where Date=@HolidayDate and profileId=@ProfileId
			  END			
				INSERT INTO system.HolidayCalendar(Date,ProfileId,HolidayListId)
				SELECT @HolidayDate , @ProfileId, @HolidayListId			

			End
			SET @Message = '5'
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
		SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), ERROR_MESSAGE(), 'SP - AddUpdateHoliday'
		raiserror ('SP - AddUpdateHoliday : %d: %s', 16, 1, @ErrorNumber, @ErrorMessage);
	END CATCH;
END

