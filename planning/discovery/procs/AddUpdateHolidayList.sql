-- =============================================
-- Create date	: 09-Jan-2017
-- Description	: Add Update Holiday List Details.
-- =============================================
CREATE PROCEDURE [dbo].[AddUpdateHolidayList]
@HolidayListId smallint=0,
@HolidayName VARCHAR(50),
@Message varchar(500) OUTPUT
AS
DECLARE @TranCount int;
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
	SET @Message = 0;
		IF(EXISTS(SELECT 1 FROM master.HolidayList WHERE (@HolidayListId = 0 AND LOWER(RTRIM(LTRIM(HolidayName))) = LOWER(LTRIM(RTRIM(@HolidayName)))) OR  (HolidayListId != @HolidayListId AND LOWER(RTRIM(LTRIM(HolidayName))) = LOWER(LTRIM(RTRIM(@HolidayName))))))
		BEGIN
			SET @Message = 10;
		END
		ELSE
		BEGIN
			IF(NOT EXISTS(SELECT 1 FROM master.HolidayList WHERE HolidayListId = @HolidayListId))
			BEGIN
				INSERT INTO master.HolidayList(HolidayName)
					VALUES (@HolidayName)
				

			END
			ELSE
			BEGIN
				UPDATE master.HolidayList SET HolidayName = @HolidayName
					WHERE HolidayListId =@HolidayListId
				
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
		SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), ERROR_MESSAGE(), 'SP - AddUpdateHolidayList'
		raiserror ('SP - AddUpdateHolidayList : %d: %s', 16, 1, @ErrorNumber, @ErrorMessage);
	END CATCH;
END

