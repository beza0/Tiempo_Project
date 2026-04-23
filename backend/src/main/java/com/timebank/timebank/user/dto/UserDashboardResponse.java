package com.timebank.timebank.user.dto;

public class UserDashboardResponse {

    private String fullName;
    private long timeCreditMinutes;
    private long mySkillsCount;
    private long sentRequestsCount;
    private long receivedRequestsCount;

    public UserDashboardResponse(String fullName, long timeCreditMinutes, long mySkillsCount, long sentRequestsCount, long receivedRequestsCount) {
        this.fullName = fullName;
        this.timeCreditMinutes = timeCreditMinutes;
        this.mySkillsCount = mySkillsCount;
        this.sentRequestsCount = sentRequestsCount;
        this.receivedRequestsCount = receivedRequestsCount;
    }

    public String getFullName() {
        return fullName;
    }

    public long getTimeCreditMinutes() {
        return timeCreditMinutes;
    }

    public long getMySkillsCount() {
        return mySkillsCount;
    }

    public long getSentRequestsCount() {
        return sentRequestsCount;
    }

    public long getReceivedRequestsCount() {
        return receivedRequestsCount;
    }
}