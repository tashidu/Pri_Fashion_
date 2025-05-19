import pymysql

try:
    # Connect to the database
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='boossa12',
        database='prifashion',
        port=3306
    )
    
    print("Connected to MySQL database successfully!")
    
    # Create a cursor
    cursor = connection.cursor()
    
    # Execute a simple query
    cursor.execute("SHOW TABLES")
    
    # Fetch all results
    tables = cursor.fetchall()
    
    print("Tables in the database:")
    for table in tables:
        print(table[0])
    
    # Close the connection
    connection.close()
    
except Exception as e:
    print(f"Error connecting to MySQL database: {e}")
