@Data
@TableName("learning_path")
public class LearningPath implements Serializable {
    
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 阶段标题
     */
    private String title;

    /**
     * 简短描述
     */
    private String shortDesc;

    /**
     * 详细描述
     */
    private String description;

    /**
     * 重点题型(JSON数组)
     */
    private String topics;

    /**
     * 推荐题目(JSON数组)
     */
    private String recommendQuestions;

    /**
     * 排序序号
     */
    private Integer orderNum;

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