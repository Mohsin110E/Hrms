-- =============================================
-- Author:		<Gaurav Narkar>
-- Create date: <10-08-2019>
-- Description:	<Creating Stored Procedure for Document save>
-- =============================================

CREATE PROCEDURE [dbo].[AddUpdateDocument](
@InsertDocumentType [DocumentType] READONLY,
@InsertExtraColumnType [DocumentExtraColumnType] READONLY,
@PrimaryKey as int,
@ProfileId as int,
@DocumentId as  bigint = 0 out
--@InsertFileDocType [FileDocType] READONLY,
--@CreatedBy as smallint

)
AS
BEGIN
SET NOCOUNT ON;
BEGIN TRANSACTION
BEGIN TRY 

--temp table for document table 
declare @tmpDocColumn TABLE(ID int IDENTITY(1, 1) PRIMARY KEY,DisplayName varchar(150),FieldValue varchar(5000),FieldName varchar(150),DataType varchar(100),
DocumentType smallint,MetaDataDetailId int,UpdateField bit,IsForiegnkey bit)
--temp table for AdditinalDocumentValue table (for extra column)
declare @tmpExtraColumn TABLE(ID int IDENTITY(1, 1) PRIMARY KEY,DisplayName varchar(150),FieldValue varchar(5000),FieldName varchar(150),DataType varchar(100),
DocumentType smallint,MetaDataDetailId int,UpdateField bit,IsForiegnkey bit)
--temp table for Filedoc table


--declare @tmpFileDoc TABLE(ID int IDENTITY(1, 1) PRIMARY KEY,DocName varchar(150))

insert into @tmpDocColumn(DisplayName,FieldValue,FieldName,DataType,DocumentType,MetaDataDetailId,UpdateField,IsForiegnkey)
select DisplayName,FieldValue,FieldName,DataType,DocumentType,MetaDataDetailId,UpdateField,IsForiegnkey from @InsertDocumentType

insert into @tmpExtraColumn(DisplayName,FieldValue,FieldName,DataType,DocumentType,MetaDataDetailId,UpdateField,IsForiegnkey)
select DisplayName,FieldValue,FieldName,DataType,DocumentType,MetaDataDetailId,UpdateField,IsForiegnkey from @InsertExtraColumnType

--insert into @tmpFileDoc(DocName)
--select DocName from @InsertFileDocType

Declare @rowCount as int = 0,@tempCount As int = 1,@sqlQuery as nvarchar(4000),@fieldName as varchar(100),@fieldValue as varchar(5000),@dataType as varchar(100)
Declare @fieldNameString as varchar(5000),@fieldValueString as varchar(5000),@documentType As int = 0,@updateString as nvarchar(4000),@fieldFinalValue as varchar(5000)
select @rowCount=count(*) from @tmpDocColumn

while(@tempCount<=@rowCount)
BEGIN
--loop to create query for document table and data into table
select @fieldName=FieldName,@fieldValue=FieldValue,@dataType=DataType,@documentType=DocumentType from @tmpDocColumn where id = @tempCount

if(@dataType != 'upload')
BEGIN
if(@dataType = 'int')
set @fieldFinalValue = (case when (@fieldValue = '') then 'null' else @fieldValue end)
else if(@dataType = 'string')
set @fieldFinalValue = ''''+@fieldValue+''''
else if(@dataType = 'password')
set @fieldFinalValue = ''''+@fieldValue+''''
else if(@dataType = 'boolean' or @dataType = 'bit')
set @fieldFinalValue = case when(@fieldValue='True') then 1 when(@fieldValue='False') then 0 else 0 end
else if(@dataType = 'upload')
set @fieldFinalValue = ''''+SUBSTRING(@fieldValue,0,LEN(@fieldValue))+''''
else if(@dataType = 'date')
--set @fieldFinalValue = ''''+@fieldValue+''''
BEGIN

set @fieldFinalValue = (case  when @fieldValue is null or @fieldValue = ''  then null else   convert(varchar, convert(datetime, @fieldValue, 103), 101) end)
--set @fieldFinalValue = (case  when @fieldValue = null or @fieldValue = '' then null else  @fieldValue  end)
if(@fieldFinalValue is not null)
set @fieldFinalValue = ''''+@fieldFinalValue+'''' 
END

 if(@fieldFinalValue is  null)
 begin
set @fieldValueString = CONCAT(@fieldValueString,' null ,')
end
else
begin
set @fieldValueString = CONCAT(@fieldValueString,@fieldFinalValue+',')
end
set @fieldNameString = CONCAT(@fieldNameString,@fieldName+',')

if(@PrimaryKey > 0)
Begin
if(@fieldFinalValue is  null)
set @updateString = CONCAT(@updateString,@fieldName+'=',' null ,')
Else
set @updateString = CONCAT(@updateString,@fieldName+'=',@fieldFinalValue+',')
END
set @fieldFinalValue = ''
END
set @tempCount =@tempCount +1;
END

if(@PrimaryKey > 0)
set @sqlQuery = CONCAT('Update HRMS.Document set '+ SUBSTRING(@updateString,0,LEN(@updateString))+' where DocumentId =',@PrimaryKey)
else
set @sqlQuery = CONCAT('insert into HRMS.Document(',SUBSTRING(@fieldNameString,0,LEN(@fieldNameString)),',ProfileId) values(',SUBSTRING(@fieldValueString,0,LEN(@fieldValueString)),',',@ProfileId,')')


exec sp_executesql @sqlQuery

Declare @PrimaryKeyNew as bigint=0
if(@PrimaryKey > 0)
set @DocumentId = @PrimaryKey
else 
BEGIN
SET @PrimaryKeyNew = IDENT_CURRENT('HRMS.Document') 
set @DocumentId = @PrimaryKeyNew
END


set @rowCount= 0 set @tempCount= 1 set @sqlQuery='' set @fieldName='' set @fieldValue='' set @dataType=''
Set @fieldNameString='' set @fieldValueString='' set @documentType= 0

select @rowCount=count(*) from @tmpExtraColumn

while(@tempCount<=@rowCount)
BEGIN
select @fieldName=MetaDataDetailId,@fieldValue=FieldValue,@dataType=DataType,@documentType=DocumentType from @tmpExtraColumn where id = @tempCount

--loop for AdditinalDocumentValue table records 
if(@dataType = 'int')
--set @fieldValueString = CONCAT(@fieldValueString,(case when (@fieldValue = '') then 'null' else ''''+@fieldValue+'''' end)+',')
set @fieldValueString = CONCAT(@fieldValueString,''''+@fieldValue+'''')
else if(@dataType = 'string')
set @fieldValueString = CONCAT(@fieldValueString,''''+@fieldValue+'''')
else if(@dataType = 'password')
set @fieldValueString = CONCAT(@fieldValueString,''''+@fieldValue+'''')
else if(@dataType = 'boolean' or @dataType = 'bit')
set @fieldValueString = CONCAT(@fieldValueString,case when(@fieldValue='1') then 1 when(@fieldValue='0') then 0 else 0 end)
else if(@dataType = 'upload')
set @fieldValueString = CONCAT(@fieldValueString,''''+SUBSTRING(@fieldValue,0,LEN(@fieldValue))+'''')
else if(@dataType = 'date')
set @fieldValueString = CONCAT(@fieldValueString,''''+@fieldValue+'''')

--set @fieldNameString = CONCAT(@fieldNameString,@fieldName)

if @PrimaryKey = 0 or @PrimaryKey is null or  not exists (select * from  master.AdditinalDocumentValue where DocumentId = @PrimaryKey and MetaDataDetailId =  @fieldName )
set @sqlQuery = CONCAT('insert into master.AdditinalDocumentValue(MetaDataDetailId,DocumentId,Value) values(',Concat(@fieldName,',',@DocumentId,',',@fieldValueString,')'))
else
set @sqlQuery = CONCAT('Update master.AdditinalDocumentValue set Value ='+@fieldValueString,' where DocumentId = ',@PrimaryKey,' And MetaDataDetailId = '+@fieldName)

--if(@PrimaryKey > 0)
--set @sqlQuery = CONCAT('Update master.AdditinalDocumentValue set Value ='+@fieldValueString,' where DocumentId = ',@PrimaryKey,' And MetaDataDetailId = '+@fieldName)
--else
--set @sqlQuery = CONCAT('insert into master.AdditinalDocumentValue(MetaDataDetailId,DocumentId,Value) values(',Concat(@fieldName,',',@DocumentId,',',@fieldValueString,')'))

	--Insert into System.ExceptionLog (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage, ErrorFrom,CreatedOn)
	--	SELECT  109, 15, 1, null, 1,@sqlQuery, 'SP - AddUpdateDocument',GETDATE()
exec sp_executesql @sqlQuery
print @sqlQuery

set @fieldNameString=''
set @fieldValueString=''

set @tempCount =@tempCount +1;
END

--set @rowCount = 0 set @tempCount = 1
--Declare @DocName as varchar(500)='',@DocPrimaryKey as bigint=0
--select @rowCount=count(*) from @tmpFileDoc
--while(@tempCount<=@rowCount)
--BEGIN
----loop for filedoc table records
--select @DocName=DocName from @tmpFileDoc where id = @tempCount

--insert into FileDoc(DocName,FolderPath,CreatedBy,CreatedOn)
--select @DocName,'',@CreatedBy,GETDATE() from @tmpFileDoc

--SET @DocPrimaryKey = IDENT_CURRENT('FileDoc') 

--insert into FileDocMapping(DocumentId,FileDocId)
--select @PrimaryKey,@DocPrimaryKey

--END

COMMIT TRANSACTION

END TRY
BEGIN CATCH
		IF XACT_STATE() <> 0 
		BEGIN
			  ROLLBACK TRANSACTION
		END
		Insert into System.ExceptionLog (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage, ErrorFrom,CreatedOn)
		SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(),ERROR_MESSAGE(), 'SP - AddUpdateDocument',GETDATE()
		DECLARE @ErrorMessage VARCHAR(2000)
		SELECT @ErrorMessage = ERROR_MESSAGE()
		RAISERROR ('Failed to Register', 16, 1)
	END CATCH;
END


