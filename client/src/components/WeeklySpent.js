import React, { Component } from 'react'
import { compose, graphql } from 'react-apollo'
import { getWeekExpenses } from '../queries/queries';
import { weekdaysBeforeToday, timestampToSimpleDate, sumPartialAmounts, getDateXDaysAgo } from '../helpers/helpers';
import { Bar } from 'react-chartjs-2';

const charOptions = {
  scales: {
    yAxes: [{
      ticks: {
        beginAtZero: true,
      }
    }]
  }
};

const getValidExpense = (amount, date) => {
  return {
    amount: amount,
    date: timestampToSimpleDate(date)
  }
}

class WeeklySpent extends Component {
  getExpenseAmounts = (obj, sinceDate) => {
    let currDate = new Date()
    let result = [];
    for (let i = 0; i < sinceDate; i++ , currDate.setDate(currDate.getDate() - 1)) {
      let dateExpenses = obj.filter(e => e.date === timestampToSimpleDate(currDate.getTime() / 1000));
      let amountSum = sumPartialAmounts(dateExpenses, 'amount');
      result.push(amountSum);
    }
    result.reverse();
    return result;
  }

  getWeeklyData = () => {
    let { getWeekExpenses } = this.props;
    if (getWeekExpenses.loading) {
      return {}
    } else {
      let { expenses } = getWeekExpenses;
      let mappedDates = expenses.map(ex => getValidExpense(ex.amount, ex.date));
      let result = {
        labels: weekdaysBeforeToday(),
        datasets: [
          {
            label: 'Weekly expenses',
            backgroundColor: 'rgb(255, 110, 48)',
            data: this.getExpenseAmounts(mappedDates, 7)
          }
        ]
      };
      return result;
    }
  }

  render = () => {
    return (
      <div>
        <Bar data={this.getWeeklyData()} options={charOptions} ref='ca' width={600} height={300} redraw />
      </div>
    )
  }
}

export default graphql(getWeekExpenses, {
  name: 'getWeekExpenses',
  options: (props) => {
    return {
      variables: {
        after: props.after,
      }
    }
  }
})(WeeklySpent);