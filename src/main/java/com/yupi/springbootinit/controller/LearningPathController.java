package com.yupi.springbootinit.controller;

import com.yupi.springbootinit.model.entity.LearningPath;
import com.yupi.springbootinit.service.LearningPathService;
import com.yupi.springbootinit.util.BaseResponse;
import com.yupi.springbootinit.util.ResultUtils;
import com.yupi.springbootinit.exception.BusinessException;
import com.yupi.springbootinit.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@RestController
@RequestMapping("/learning-path")
@Slf4j
public class LearningPathController {

    @Resource
    private LearningPathService learningPathService;

    @GetMapping("/list")
    public BaseResponse<List<LearningPath>> getLearningPaths() {
        try {
            List<LearningPath> paths = learningPathService.getLearningPaths();
            return ResultUtils.success(paths);
        } catch (Exception e) {
            log.error("获取学习路线失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "获取学习路线失败");
        }
    }
} 