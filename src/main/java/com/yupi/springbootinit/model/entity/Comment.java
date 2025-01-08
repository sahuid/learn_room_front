@Data
@TableName("comment")
public class Comment implements Serializable {
    
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 题目id
     */
    private Long questionId;

    /**
     * 评论内容
     */
    private String content;

    /**
     * 评论用户id
     */
    private Long userId;

    /**
     * 父评论id，用于回复功能
     */
    private Long parentId;

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 更新时间
     */
    private Date updateTime;

    private static final long serialVersionUID = 1L;
} 