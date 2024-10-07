import 'package:flutter/material.dart';
import 'package:town_pass/gen/assets.gen.dart';

abstract final class TrendingServiceModel {
  static List<TrendingService> get serviceList {
    return [
      TrendingService(
        icon: Assets.svg.iconDashboardReports.svg(),
        title: '市民儀表板',
        url: 'https://dashboard.gov.taipei/',
      ),
      TrendingService(
        icon: Assets.svg.iconLocationSearch.svg(),
        title: '降雨報報',
        //url: 'http://10.0.2.2:54088/',
        url: 'http://10.0.2.2:54088/'
      ),
      // 在此列表後加入新熱門按鈕
      // add new trending service button here
    ];
  }
}

class TrendingService {
  final Widget icon;
  final String title;
  final String url;

  const TrendingService({
    required this.icon,
    required this.title,
    required this.url,
  });
}
