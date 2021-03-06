import React, { Component, Fragment } from 'react'
import { graphql } from 'react-apollo'
import { getWeekExpenses } from '../queries/queries';
import { sumPartialAmounts } from '../helpers/helpers';
import { Bar } from 'react-chartjs-2';
import { Typography } from '@material-ui/core';

const charOptions = {
  scales: {
    yAxes: [{
      ticks: {
        beginAtZero: true,
      }
    }]
  }
};


class MonthlySpent extends Component {
  getExpenseAmounts = (obj) => {
    let dateSpans = this.props.after;
    let result = [];
    for (let i = 0; i < dateSpans.length; i++) {
      let currWeek = obj.filter(e =>
        e.date > dateSpans[i].start.getTime() / 1000 &&
        e.date < dateSpans[i].end.getTime() / 1000
      );
      let amount = sumPartialAmounts(currWeek, 'amount');
      result.push(amount);
    }
    return result;
  }

  getWeeklyData = () => {
    let { getWeekExpenses } = this.props;
    if (getWeekExpenses.loading) {
      return {}
    } else {
      let { expenses } = getWeekExpenses;
      let result = {
        labels: this.props.after.map(e => e.label),
        datasets: [
          {
            label: 'Monthly expenses',
            backgroundColor: 'rgba(124, 144, 255, 0.4)',
            borderColor: 'rgba(124, 144, 255, 1)',
            borderWidth: 1,
            data: this.getExpenseAmounts(expenses)
          }
        ]
      };
      return result;
    }
  }

  render = () => {
    return (
      <Fragment>
        <Typography variant="display1" style={{ textAlign: 'center' }}>
          Monthly money spent
        </Typography>
        <Bar data={this.getWeeklyData()} options={charOptions} ref='ca' width={600} height={300} redraw />
      </Fragment>
    )
  }
}

export default graphql(getWeekExpenses, {
  name: 'getWeekExpenses',
  options: (props) => {
    return {
      variables: {
        after: String(new Date(props.after[0].start).getTime() / 1000),
      }
    }
  }
})(MonthlySpent);