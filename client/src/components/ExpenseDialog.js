import React, { Component } from 'react'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { List } from '@material-ui/core';
import { graphql, compose } from 'react-apollo';
import { getUsersQuery, addExpenseMutation, getExpensesQuery, addDebtMutation, getDebtsQuery, getMoneyOwedQuery, getWeekExpenses } from '../queries/queries';
import SplitListItem from './SplitListItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import { sumPartialAmounts } from '../helpers/helpers';

class ExpenseDialog extends Component {
  payingUsers = [];

  componentWillMount = () => {
    this.props.getUsersQuery.refetch()
      .then((result) => {
        result.data.users.forEach(user => {
          this.payingUsers[user.id] = {
            checked: true,
            amount: 0,
          }
        });
      }).catch((err) => {
        console.error(err);
      });
  }

  handlerAdd = (userId, newAmount) => {
    this.payingUsers[userId] = {
      checked: this.payingUsers[userId].checked,
      amount: newAmount,
    }
    console.log(this.payingUsers[userId].amount);
  }

  handlerCheckbox = (userId) => {
    this.payingUsers[userId] = {
      checked: !this.payingUsers[userId].checked,
      amount: this.payingUsers[userId].amount,
    }
    console.log(this.payingUsers[userId].checked);
  }

  displaySplitListItems = () => {
    let { getUsersQuery } = this.props;
    if (getUsersQuery.loading) {
      return (
        <CircularProgress size={40}
          left={-20}
          top={10}
          status={'loading'}
          style={{ marginLeft: '50%' }}
          color="secondary"
        />
      );
    } else {
      return getUsersQuery.users.map(user => {
        return <SplitListItem key={user.id} user={user} handlerAdd={this.handlerAdd} handlerCheckbox={this.handlerCheckbox} />
      });
    }
  }

  addDebts = (result) => {
    let expense = result.data.addExpense;
    let users = this.payingUsers;

    let onlyPaying = [];
    for (let [key, value] of Object.entries(users)) {
      if (value.checked) onlyPaying.push({ id: key, amount: value.amount });
    }

    let partialTotal = sumPartialAmounts(onlyPaying, 'amount');
    console.log("Partial Total: ", partialTotal);
    let remainder = parseFloat(this.props.formState.amount) - partialTotal;
    if (remainder < 0) {
      console.error("remained < 0");
      return;
    }
    let i = 0;
    onlyPaying.forEach(user => {
      i++;
      if (user.id !== this.props.formState.payerId)
        this.props.addDebtMutation({
          variables: {
            lenderId: expense.payer.id,
            debtorId: user.id,
            expenseId: expense.id,
            amount: Math.round((user.amount + remainder / onlyPaying.length) * 100) / 100,
          },
          refetchQueries: i === onlyPaying.length ? [
            { query: getDebtsQuery },
            { query: getMoneyOwedQuery },
            { query: getExpensesQuery },
          ] : undefined,
        });
    });
    this.props.handleClose();
  }

  submitForm = (e) => {
    e.preventDefault();
    console.log(this.props);
    this.props.addExpenseMutation({
      variables: {
        payerId: this.props.formState.payerId,
        amount: parseFloat(this.props.formState.amount),
        date: Math.round(new Date().getTime() / 1000).toString(),
        description: this.props.formState.description,
      },
      refetchQueries: [
        { query: getWeekExpenses },
      ]
    }).then((result) => {
      this.addDebts(result);
    }).catch((err) => {
      console.log(err);
    });
  }

  render = () => {
    return (
      <Dialog
        open={this.props.formState.open}
        onClose={this.props.handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Who contributes to the expense</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select who has to pay for the expense and what percentage of it
            </DialogContentText>
          <List>
            {this.displaySplitListItems()}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.handleClose} color="default">
            Cancel
            </Button>
          <Button onClick={this.submitForm} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}


export default compose(
  graphql(getUsersQuery, { name: 'getUsersQuery' }),
  graphql(addExpenseMutation, { name: 'addExpenseMutation' }),
  graphql(addDebtMutation, { name: 'addDebtMutation' }),
  graphql(getMoneyOwedQuery, { name: 'getMoneyOwedQuery' }),
  graphql(getWeekExpenses, { name: 'getWeekExpenses' }),
)(ExpenseDialog);