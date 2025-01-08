package com.yupi.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.yupi.springbootinit.mapper.LearningPathMapper;
import com.yupi.springbootinit.model.entity.LearningPath;
import com.yupi.springbootinit.service.LearningPathService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LearningPathServiceImpl extends ServiceImpl<LearningPathMapper, LearningPath> implements LearningPathService {

    @Override
    public List<LearningPath> getLearningPaths() {
        // 按序号排序获取所有学习路线
        return this.list(new QueryWrapper<LearningPath>()
                .orderByAsc("order_num"));
    }
} 