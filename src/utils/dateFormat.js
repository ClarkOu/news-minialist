// frontend/src/utils/dateFormat.js
import { formatDistance, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatRelativeDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), {
      addSuffix: true,
      locale: zhCN
    });
  } catch (e) {
    return '未知时间';
  }
};

export const formatDate = (dateString, formatPattern = 'yyyy年MM月dd日 HH:mm') => {
  try {
    return format(new Date(dateString), formatPattern, { locale: zhCN });
  } catch (e) {
    return '未知时间';
  }
};