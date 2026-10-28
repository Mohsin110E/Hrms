-- =============================================

-- Create date	: 18/11/2019
-- Description	: Add Update comp off details
-- =============================================
create PROCEDURE AddToken
   @AuthToken varchar(250) = null,
   @ProfileId int = null
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
	    declare @TokenId bigint ;	
	   Select @TokenId = TokenId from HRMS.Token where  ProfileId = @ProfileId 
	 

	 if(@TokenId is null)
	 Begin

   
	   insert into HRMS.Token (
         AuthToken
        ,CreatedDate
        ,ProfileId
       
		)

      VALUES(
		 @AuthToken
        ,GETUTCDATE()
        ,@ProfileId
        )
        
		
		Set @TokenId = IDENT_CURRENT('HRMS.Token') ;
		End

        select TokenId,AuthToken from HRMS.Token where TokenId = @TokenId
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
		raiserror ('SP - AddToken : %d: %s', 16, 1, @ErrorNumber, @ErrorMessage);
	END CATCH;
END

