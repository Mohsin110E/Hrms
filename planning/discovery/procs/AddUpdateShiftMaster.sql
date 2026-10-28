-- =============================================
-- Author:		Mohseena
-- Create date: 23/06/2020
-- Description:	<Creating Stored Procedure for AddUpdateShift>
-- TEST CASE  : [AddUpdateShiftMaster] 0,'gen','12:00:00.0000','20:00:00.0000',12,22,2,2,''
-- =============================================
CREATE PROCEDURE [dbo].[AddUpdateShiftMaster]
	-- Add the parameters for the stored procedure here
	(
	@ShiftId INT = NULL,
	@ShiftName VARCHAR(100),
	@StartTime TIME(4),
	@EndTime TIME(4),
	@AltStartTime TIME(4),
	@AltEndTime TIME(4),
	@LateMinutes INT,
	@HalfDayMinutes INT,
	@CreatedBy INT,
	@MessageId INT OUTPUT
	)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	BEGIN TRY
		BEGIN TRANSACTION

		DECLARE @CreatedOn AS DATETIME = getdate()

		SET @MessageId = 5

		--Check Duplicate Record
		IF (
				EXISTS (
					SELECT 1
					FROM master.Shift
					WHERE ShiftName = LTRIM(RTRIM(@ShiftName))
						AND ShiftId <> @ShiftId
					)
				)
		BEGIN
			SET @MessageId = 28
		END
		ELSE
		BEGIN
			IF (@ShiftId IS NULL)
			BEGIN
				INSERT INTO master.Shift (
					ShiftName,
					StartTime,
					EndTime,
					LateMinutes,
					HalfDayMinutes,
					CreatedBy,
					CreatedOn,
					AltStartTime,
					AltEndTime
					)
				VALUES (
					ltrim(rtrim(@ShiftName)),
					@StartTime,
					@EndTime,
					@LateMinutes,
					@HalfDayMinutes,
					@CreatedBy,
					@CreatedOn,
					@AltStartTime,
					@AltEndTime
					)
					-- Insert statements for procedure here
			END
			ELSE
			BEGIN
				UPDATE master.Shift
				SET ShiftName = @ShiftName,
					StartTime = @StartTime,
					EndTime = @EndTime,
					LateMinutes = @LateMinutes,
					ModifiedBy = @CreatedBy,
					MOdifiedOn = @CreatedOn,
					HalfDayMinutes = @HalfDayMinutes,
					AltStartTime = @AltStartTime,
					AltEndTime = @AltEndTime
				WHERE ShiftId = @ShiftId
			END
		END

		COMMIT TRANSACTION
	END TRY

	BEGIN CATCH
		IF XACT_STATE() <> 0
			ROLLBACK TRANSACTION

		INSERT INTO system.ExceptionLog (
			ErrorNumber,
			ErrorSeverity,
			ErrorState,
			ErrorProcedure,
			ErrorLine,
			ErrorMessage,
			ErrorFrom,
			CreatedOn
			)
		SELECT ERROR_NUMBER(),
			ERROR_SEVERITY(),
			ERROR_STATE(),
			ERROR_PROCEDURE(),
			ERROR_LINE(),
			ERROR_MESSAGE(),
			'SP - AddUpdateShiftMaster',
			GETUTCDATE()

		DECLARE @ErrorMessage VARCHAR(2000)

		SELECT @ErrorMessage = ERROR_MESSAGE()

		RAISERROR (
				@ErrorMessage,
				16,
				1
				)
	END CATCH;
END
