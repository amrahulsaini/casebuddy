-- Reset sort_order to 1,2,3,4... for ALL categories automatically
-- This will give each product a sequential number within each category

-- Use a stored procedure to handle all categories
DELIMITER //

CREATE PROCEDURE reset_all_category_sort_orders()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE cat_id INT;
    DECLARE row_num INT;
    
    -- Cursor to get all categories
    DECLARE category_cursor CURSOR FOR 
        SELECT DISTINCT category_id FROM product_categories ORDER BY category_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN category_cursor;
    
    read_loop: LOOP
        FETCH category_cursor INTO cat_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Reset row number for each category
        SET row_num = 0;
        
        -- Update sort_order for this category's products
        UPDATE product_categories pc
        INNER JOIN (
            SELECT 
                product_id,
                category_id,
                (@rn := @rn + 1) as new_sort_order
            FROM product_categories
            CROSS JOIN (SELECT @rn := 0) r
            WHERE category_id = cat_id
            ORDER BY product_id
        ) sorted ON pc.product_id = sorted.product_id AND pc.category_id = sorted.category_id
        SET pc.sort_order = sorted.new_sort_order
        WHERE pc.category_id = cat_id;
        
    END LOOP;
    
    CLOSE category_cursor;
END//

DELIMITER ;

-- Run the procedure
CALL reset_all_category_sort_orders();

-- Drop the procedure (cleanup)
DROP PROCEDURE reset_all_category_sort_orders;

-- Verify the results for a few categories
SELECT 
    c.name as category_name,
    COUNT(*) as product_count,
    MIN(pc.sort_order) as min_sort,
    MAX(pc.sort_order) as max_sort
FROM product_categories pc
JOIN categories c ON pc.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name
LIMIT 10;
